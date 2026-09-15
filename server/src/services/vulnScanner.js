/**
 * Vulnerability Scanner using OSV.dev API (free, no auth required)
 * Docs: https://osv.dev/docs/
 */

const OSV_API = 'https://api.osv.dev/v1';

// Map our file types to OSV ecosystem names
const ECOSYSTEM_MAP = {
  npm: 'npm',
  maven: 'Maven',
  pip: 'PyPI',
  gradle: 'Maven' // Gradle uses Maven repos
};

/**
 * Map CVSS score to severity label
 */
function scoreToseverity(score) {
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 4.0) return 'MODERATE';
  if (score > 0) return 'LOW';
  return 'UNKNOWN';
}

/**
 * Extract severity information from an OSV vulnerability record
 */
function extractSeverity(vuln) {
  // Check severity array (CVSS)
  if (vuln.severity && vuln.severity.length > 0) {
    for (const sev of vuln.severity) {
      if (sev.type === 'CVSS_V3' && sev.score) {
        // Parse CVSS vector for base score
        const baseScoreMatch = sev.score.match(/CVSS:3\.\d\/.*?/);
        if (baseScoreMatch) {
          // Try database_specific for score
          if (vuln.database_specific?.cvss_score) {
            return {
              score: vuln.database_specific.cvss_score,
              severity: scoreToseverity(vuln.database_specific.cvss_score)
            };
          }
        }
      }
    }
  }

  // Check database_specific
  if (vuln.database_specific) {
    if (vuln.database_specific.severity) {
      return {
        score: null,
        severity: vuln.database_specific.severity.toUpperCase()
      };
    }
    if (vuln.database_specific.cvss_score) {
      return {
        score: vuln.database_specific.cvss_score,
        severity: scoreToseverity(vuln.database_specific.cvss_score)
      };
    }
  }

  // Check ecosystem_specific
  if (vuln.ecosystem_specific?.severity) {
    return {
      score: null,
      severity: vuln.ecosystem_specific.severity.toUpperCase()
    };
  }

  return { score: null, severity: 'UNKNOWN' };
}

/**
 * Extract fix version from affected ranges
 */
function extractFixVersion(affected) {
  if (!affected) return null;
  for (const aff of affected) {
    if (aff.ranges) {
      for (const range of aff.ranges) {
        if (range.events) {
          for (const event of range.events) {
            if (event.fixed) return event.fixed;
          }
        }
      }
    }
  }
  return null;
}

/**
 * Batch query OSV for vulnerabilities
 */
export async function scanVulnerabilities(dependencies, fileType) {
  const ecosystem = ECOSYSTEM_MAP[fileType];
  if (!ecosystem) return dependencies;

  // Build batch query
  const queries = dependencies
    .filter(dep => dep.currentVersion && dep.currentVersion !== 'any' && dep.currentVersion !== 'managed')
    .map(dep => {
      const packageName = (fileType === 'maven' || fileType === 'gradle')
        ? dep.name  // groupId:artifactId format
        : dep.name;

      return {
        package: {
          name: packageName,
          ecosystem
        },
        version: dep.currentVersion
      };
    });

  if (queries.length === 0) return dependencies;

  // OSV batch endpoint supports up to 1000 queries
  const BATCH_SIZE = 1000;
  const allResults = [];

  for (let i = 0; i < queries.length; i += BATCH_SIZE) {
    const batch = queries.slice(i, i + BATCH_SIZE);

    try {
      const res = await fetch(`${OSV_API}/querybatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: batch })
      });

      if (!res.ok) {
        console.error(`OSV API error: ${res.status} ${res.statusText}`);
        continue;
      }

      const data = await res.json();
      allResults.push(...(data.results || []));
    } catch (err) {
      console.error(`OSV API request failed: ${err.message}`);
    }
  }

  // Map results back to dependencies
  let queryIndex = 0;
  for (const dep of dependencies) {
    if (!dep.currentVersion || dep.currentVersion === 'any' || dep.currentVersion === 'managed') {
      continue;
    }

    const result = allResults[queryIndex];
    queryIndex++;

    if (!result || !result.vulns || result.vulns.length === 0) continue;

    // Fetch full vulnerability details for each
    const vulnDetails = [];
    for (const vulnRef of result.vulns.slice(0, 10)) { // Limit to 10 per package
      try {
        const vulnRes = await fetch(`${OSV_API}/vulns/${vulnRef.id}`);
        if (vulnRes.ok) {
          const fullVuln = await vulnRes.json();
          const { score, severity } = extractSeverity(fullVuln);
          const fixVersion = extractFixVersion(fullVuln.affected);

          vulnDetails.push({
            id: fullVuln.id,
            aliases: fullVuln.aliases || [],
            summary: fullVuln.summary || 'No summary available',
            details: fullVuln.details?.substring(0, 500) || '',
            severity,
            severityScore: score,
            affectedRange: JSON.stringify(fullVuln.affected?.[0]?.ranges?.[0]?.events || []),
            fixVersion,
            advisoryUrl: fullVuln.references?.[0]?.url || `https://osv.dev/vulnerability/${fullVuln.id}`,
            packageName: dep.name
          });
        }
      } catch (err) {
        console.error(`Failed to fetch vuln details for ${vulnRef.id}: ${err.message}`);
      }
    }

    dep.vulnerabilities = vulnDetails;
  }

  return dependencies;
}

/**
 * Compute risk score from analysis results
 */
export function computeRiskScore(dependencies) {
  if (dependencies.length === 0) return 0;

  let score = 0;
  let totalWeight = 0;

  for (const dep of dependencies) {
    // Version drift contributes to risk
    switch (dep.status) {
      case 'major-behind': score += 15; break;
      case 'minor-behind': score += 5; break;
      case 'outdated': score += 20; break;
    }
    totalWeight++;

    // Vulnerabilities are the biggest risk factor
    for (const vuln of (dep.vulnerabilities || [])) {
      switch (vuln.severity) {
        case 'CRITICAL': score += 25; break;
        case 'HIGH': score += 18; break;
        case 'MODERATE': score += 10; break;
        case 'LOW': score += 3; break;
        default: score += 5;
      }
    }
  }

  // Normalize to 0-100
  const maxPossible = totalWeight * 20 + dependencies.reduce((acc, d) =>
    acc + (d.vulnerabilities?.length || 0) * 25, 0) || 1;

  const normalized = Math.min(100, Math.round((score / Math.max(maxPossible, score)) * 100));
  return normalized;
}
