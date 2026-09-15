import semver from 'semver';

/**
 * Check latest versions from upstream registries
 */

const REGISTRY_TIMEOUT = 8000;

async function fetchWithTimeout(url, timeout = REGISTRY_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Get latest npm package version
 */
async function getNpmLatest(packageName) {
  try {
    const encoded = packageName.replace('/', '%2f');
    const res = await fetchWithTimeout(`https://registry.npmjs.org/${encoded}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data['dist-tags']?.latest || null;
  } catch {
    return null;
  }
}

/**
 * Get latest Maven artifact version
 */
async function getMavenLatest(groupId, artifactId) {
  try {
    const url = `https://search.maven.org/solrsearch/select?q=g:"${encodeURIComponent(groupId)}"+AND+a:"${encodeURIComponent(artifactId)}"&wt=json&rows=1`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.response?.docs?.[0]?.latestVersion || null;
  } catch {
    return null;
  }
}

/**
 * Get latest PyPI package version
 */
async function getPypiLatest(packageName) {
  try {
    const res = await fetchWithTimeout(`https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.info?.version || null;
  } catch {
    return null;
  }
}

/**
 * Classify how far behind a version is
 */
function classifyVersionDrift(current, latest) {
  if (!current || !latest || current === 'any' || current === 'managed') return 'unknown';

  // Clean versions for semver comparison
  const cleanCurrent = semver.valid(semver.coerce(current));
  const cleanLatest = semver.valid(semver.coerce(latest));

  if (!cleanCurrent || !cleanLatest) return 'unknown';

  if (semver.gte(cleanCurrent, cleanLatest)) return 'up-to-date';
  if (semver.major(cleanCurrent) < semver.major(cleanLatest)) return 'major-behind';
  if (semver.minor(cleanCurrent) < semver.minor(cleanLatest)) return 'minor-behind';
  return 'up-to-date'; // only patch difference
}

/**
 * Check all dependencies for latest versions
 * Processes in batches to avoid rate limiting
 */
export async function checkVersions(dependencies, fileType) {
  const BATCH_SIZE = 10;
  const results = [...dependencies];

  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    const batch = results.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (dep) => {
      let latest = null;

      switch (fileType) {
        case 'npm':
          latest = await getNpmLatest(dep.name);
          break;
        case 'maven':
        case 'gradle':
          if (dep.groupId && dep.artifactId) {
            latest = await getMavenLatest(dep.groupId, dep.artifactId);
          }
          break;
        case 'pip':
          latest = await getPypiLatest(dep.name);
          break;
      }

      dep.latestVersion = latest;
      dep.status = classifyVersionDrift(dep.currentVersion, latest);
      return dep;
    });

    await Promise.all(promises);
  }

  return results;
}
