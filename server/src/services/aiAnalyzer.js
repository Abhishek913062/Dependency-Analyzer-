import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generate comprehensive AI analysis using Google Gemini
 */
export async function analyzeWithAI(scanData) {
  const { fileType, dependencies, vulnerabilities, riskScore } = scanData;

  // Build structured context for Gemini
  const depSummary = dependencies.map(d => ({
    name: d.name,
    current: d.currentVersion,
    latest: d.latestVersion,
    status: d.status,
    type: d.type,
    vulnCount: d.vulnerabilities?.length || 0,
    vulns: (d.vulnerabilities || []).map(v => ({
      id: v.id,
      severity: v.severity,
      summary: v.summary,
      fixVersion: v.fixVersion
    }))
  }));

  const ecosystemLabel = {
    npm: 'Node.js/npm',
    maven: 'Java/Maven',
    pip: 'Python/pip',
    gradle: 'Java/Gradle'
  }[fileType] || fileType;

  const prompt = `You are an expert software security analyst and dependency management advisor. Analyze the following ${ecosystemLabel} project dependencies and provide a comprehensive risk assessment.

## Project Context
- Ecosystem: ${ecosystemLabel}
- Total Dependencies: ${dependencies.length}
- Risk Score: ${riskScore}/100
- Total Vulnerabilities Found: ${vulnerabilities.length}

## Dependencies Data
${JSON.stringify(depSummary, null, 2)}

## Required Analysis Sections

Please provide your analysis in the following structured format with these exact section headers:

### 🛡️ Risk Summary
Provide an overall health assessment of this project's dependency tree. Mention key metrics and the biggest risks.

### 🚨 Priority Upgrades
List the most urgent packages to upgrade, ranked by risk. For each, explain WHY it's critical and what to upgrade to. Format as a numbered list.

### ⚡ Conflict Detection
Identify any potential version conflicts, incompatibilities, or peer dependency issues between the listed packages. If none are apparent, suggest what to watch for.

### 📋 Migration Guide
Provide a step-by-step upgrade plan. Group related upgrades that should be done together. Include specific version targets and any breaking changes to be aware of.

### 🔒 Security Recommendations
Provide specific remediation steps for each vulnerability found. Include CVE references, affected versions, and the minimum safe version. Add general security best practices for this ecosystem.

Be specific, actionable, and concise. Use markdown formatting for readability.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    const fullText = response.text;

    // Parse sections from the response
    const sections = parseSections(fullText);

    return {
      riskSummary: sections.riskSummary || '',
      priorityUpgrades: sections.priorityUpgrades || '',
      conflictDetection: sections.conflictDetection || '',
      migrationGuide: sections.migrationGuide || '',
      securityRecommendations: sections.securityRecommendations || '',
      fullAnalysis: fullText
    };
  } catch (error) {
    console.error('Gemini AI analysis failed:', error.message);
    return {
      riskSummary: `AI analysis could not be completed: ${error.message}`,
      priorityUpgrades: '',
      conflictDetection: '',
      migrationGuide: '',
      securityRecommendations: '',
      fullAnalysis: `Error: ${error.message}`
    };
  }
}

/**
 * Parse structured sections from Gemini's markdown response
 */
function parseSections(text) {
  const sections = {};
  const sectionPatterns = [
    { key: 'riskSummary', pattern: /###\s*🛡️\s*Risk Summary\s*\n([\s\S]*?)(?=###|$)/ },
    { key: 'priorityUpgrades', pattern: /###\s*🚨\s*Priority Upgrades\s*\n([\s\S]*?)(?=###|$)/ },
    { key: 'conflictDetection', pattern: /###\s*⚡\s*Conflict Detection\s*\n([\s\S]*?)(?=###|$)/ },
    { key: 'migrationGuide', pattern: /###\s*📋\s*Migration Guide\s*\n([\s\S]*?)(?=###|$)/ },
    { key: 'securityRecommendations', pattern: /###\s*🔒\s*Security Recommendations\s*\n([\s\S]*?)(?=###|$)/ }
  ];

  for (const { key, pattern } of sectionPatterns) {
    const match = text.match(pattern);
    if (match) {
      sections[key] = match[1].trim();
    }
  }

  return sections;
}
