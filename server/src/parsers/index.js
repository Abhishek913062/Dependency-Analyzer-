import { XMLParser } from 'fast-xml-parser';

/**
 * Detect file type from filename and content
 */
export function detectFileType(fileName, content) {
  const name = fileName.toLowerCase();
  if (name === 'package.json' || name.endsWith('/package.json')) return 'npm';
  if (name === 'pom.xml' || name.endsWith('/pom.xml')) return 'maven';
  if (name === 'requirements.txt' || name.endsWith('/requirements.txt')) return 'pip';
  if (name === 'build.gradle' || name.endsWith('/build.gradle')) return 'gradle';

  // Try content-based detection
  try {
    const parsed = JSON.parse(content);
    if (parsed.dependencies || parsed.devDependencies) return 'npm';
  } catch {}

  if (content.includes('<project') && content.includes('<dependencies>')) return 'maven';
  if (content.match(/^[\w-]+==/m)) return 'pip';
  if (content.includes('implementation') || content.includes('compile')) return 'gradle';

  return null;
}

/**
 * Parse package.json
 */
function parsePackageJson(content) {
  const pkg = JSON.parse(content);
  const deps = [];

  const addDeps = (depObj, type) => {
    if (!depObj) return;
    for (const [name, versionRange] of Object.entries(depObj)) {
      const version = versionRange.replace(/^[\^~>=<\s]+/, '').split(' ')[0];
      deps.push({
        name,
        currentVersion: version,
        latestVersion: null,
        status: 'unknown',
        type,
        vulnerabilities: [],
        groupId: null,
        artifactId: null
      });
    }
  };

  addDeps(pkg.dependencies, 'production');
  addDeps(pkg.devDependencies, 'development');
  addDeps(pkg.peerDependencies, 'peer');
  addDeps(pkg.optionalDependencies, 'optional');

  return deps;
}

/**
 * Parse pom.xml (Maven)
 */
function parsePomXml(content) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => name === 'dependency'
  });

  const result = parser.parse(content);
  const deps = [];

  // Handle properties for version variable resolution
  const properties = result?.project?.properties || {};

  const resolveProp = (val) => {
    if (!val || typeof val !== 'string') return val;
    return val.replace(/\$\{([^}]+)\}/g, (_, key) => {
      return properties[key] || `\${${key}}`;
    });
  };

  const extractDeps = (depList, type) => {
    if (!depList) return;
    const list = Array.isArray(depList) ? depList : [depList];
    for (const dep of list) {
      if (!dep.groupId || !dep.artifactId) continue;
      const version = resolveProp(dep.version) || 'managed';
      deps.push({
        name: `${dep.groupId}:${dep.artifactId}`,
        currentVersion: version,
        latestVersion: null,
        status: 'unknown',
        type,
        vulnerabilities: [],
        groupId: dep.groupId,
        artifactId: dep.artifactId
      });
    }
  };

  // Main dependencies
  const mainDeps = result?.project?.dependencies?.dependency;
  extractDeps(mainDeps, 'production');

  // Dependency management
  const managedDeps = result?.project?.dependencyManagement?.dependencies?.dependency;
  extractDeps(managedDeps, 'production');

  // Build plugin dependencies
  const plugins = result?.project?.build?.plugins?.plugin;
  if (plugins) {
    const pluginList = Array.isArray(plugins) ? plugins : [plugins];
    for (const plugin of pluginList) {
      if (plugin.dependencies?.dependency) {
        extractDeps(plugin.dependencies.dependency, 'development');
      }
    }
  }

  return deps;
}

/**
 * Parse requirements.txt (Python/pip)
 */
function parseRequirementsTxt(content) {
  const deps = [];
  const lines = content.split('\n');

  for (let line of lines) {
    line = line.trim();
    // Skip comments, empty lines, and option lines
    if (!line || line.startsWith('#') || line.startsWith('-')) continue;

    // Handle inline comments
    line = line.split('#')[0].trim();

    // Parse version specifiers: ==, >=, <=, ~=, !=, >, <
    const match = line.match(/^([a-zA-Z0-9_.-]+)\s*(?:\[.*?\])?\s*([=!<>~]+\s*[\d.*]+(?:\s*,\s*[=!<>~]+\s*[\d.*]+)*)?/);
    if (match) {
      const name = match[1];
      let version = 'any';
      if (match[2]) {
        // Extract the primary version
        const versionMatch = match[2].match(/==\s*([\d.]+)/);
        if (versionMatch) {
          version = versionMatch[1];
        } else {
          const geMatch = match[2].match(/>=\s*([\d.]+)/);
          version = geMatch ? geMatch[1] : match[2].trim();
        }
      }

      deps.push({
        name,
        currentVersion: version,
        latestVersion: null,
        status: 'unknown',
        type: 'production',
        vulnerabilities: [],
        groupId: null,
        artifactId: null
      });
    }
  }

  return deps;
}

/**
 * Parse build.gradle
 */
function parseBuildGradle(content) {
  const deps = [];
  const depPatterns = [
    // implementation 'group:artifact:version'
    /(?:implementation|compile|api|runtimeOnly|compileOnly|testImplementation|testCompile|annotationProcessor)\s*['"(]+([^'"():]+):([^'"():]+):([^'"()]+)['")\s]/g,
    // implementation group: 'x', name: 'y', version: 'z'
    /(?:implementation|compile|api|runtimeOnly|compileOnly|testImplementation|testCompile)\s*\(\s*group:\s*['"]([^'"]+)['"]\s*,\s*name:\s*['"]([^'"]+)['"]\s*,\s*version:\s*['"]([^'"]+)['"]\s*\)/g
  ];

  for (const pattern of depPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const groupId = match[1].trim();
      const artifactId = match[2].trim();
      const version = match[3].trim().replace(/['")\s]+$/, '');

      deps.push({
        name: `${groupId}:${artifactId}`,
        currentVersion: version,
        latestVersion: null,
        status: 'unknown',
        type: 'production',
        vulnerabilities: [],
        groupId,
        artifactId
      });
    }
  }

  return deps;
}

/**
 * Main parse function — auto-detects and parses
 */
export function parseDependencies(fileName, content) {
  const fileType = detectFileType(fileName, content);
  if (!fileType) {
    throw new Error(`Unsupported file type: ${fileName}. Supported: package.json, pom.xml, requirements.txt, build.gradle`);
  }

  let dependencies;
  switch (fileType) {
    case 'npm':
      dependencies = parsePackageJson(content);
      break;
    case 'maven':
      dependencies = parsePomXml(content);
      break;
    case 'pip':
      dependencies = parseRequirementsTxt(content);
      break;
    case 'gradle':
      dependencies = parseBuildGradle(content);
      break;
    default:
      throw new Error(`Parser not implemented for: ${fileType}`);
  }

  return { fileType, dependencies };
}
