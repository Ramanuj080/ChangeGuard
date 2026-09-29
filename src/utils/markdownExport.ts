import { AnalysisExportData } from './pdfExport';

export function exportAnalysisToMarkdown(data: AnalysisExportData): void {
  const formattedDate = new Date(data.analysisDate).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'medium'
  });

  const lines: string[] = [
    `# CHANGEGUARD PRE-DEPLOYMENT IMPACT ANALYSIS`,
    `> **"Know the blast radius before you deploy."**`,
    ``,
    `* **Project**: \`${data.project}\``,
    `* **Analysis Date**: ${formattedDate}`,
    `* **Status**: COMPLETED`,
    `* **Target Component**: \`${data.changeRequest.targetComponent}\``,
    `* **Change Type**: ${data.changeRequest.changeType}`,
    ``,
    `---`,
    ``,
    `## 1. Executive Summary`,
    ``,
    `| Metric | Value |`,
    `| :--- | :--- |`,
    `| **Risk Level** | **${data.riskLevel}** |`,
    `| **Risk Index** | **${data.riskScore} / 100** |`,
    `| **Blast Radius** | **${data.affectedComponents} Components** |`,
    `| **Files Analyzed** | ${data.filesAnalyzed} |`,
    `| **Dependencies Detected** | ${data.dependencies} |`,
    `| **APIs Detected** | ${data.apisDetected} |`,
    `| **Databases** | ${data.databaseReferences} |`,
    `| **External Services** | ${data.externalServices} |`,
    ``,
    `### Proposed Change Description`,
    `> ${data.changeRequest.description || 'No description provided.'}`,
    ``,
    `---`,
    ``,
    `## 2. Impact Analysis`,
    ``,
    `### Direct Impact (${data.directImpact.length} components)`,
    data.directImpact.length > 0 
      ? data.directImpact.map(c => `- \`${c}\` *(Direct consumer / caller)*`).join('\n')
      : `*No direct downstream consumers detected.*`,
    ``,
    `### Indirect Impact (${data.indirectImpact.length} components)`,
    data.indirectImpact.length > 0
      ? data.indirectImpact.map(c => `- \`${c}\` *(Cascading downstream)*`).join('\n')
      : `*No cascading secondary dependencies affected.*`,
    ``,
    `### Dependency Ripple Flow`,
    `\`\`\``,
    `[TARGET] ${data.changeRequest.targetComponent}`,
    `   │   (Direct contract invocation)`,
    `   ▼`,
    `[DIRECT] ${data.directImpact.length > 0 ? data.directImpact.join(', ') : 'None'}`,
    ...(data.indirectImpact.length > 0 ? [
      `   │   (Secondary cascade)`,
      `   ▼`,
      `[CASCADE] ${data.indirectImpact.join(', ')}`
    ] : []),
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## 3. Why is this risky? (Risk Factors)`,
    ``,
    ...data.riskFactors.map((factor, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      return `${num}. **${factor}**\n   - Evaluated against runtime contracts, service dependencies, and historical patterns.`;
    }),
    ``,
    `---`,
    ``,
    `## 4. Recommended Actions`,
    ``,
    ...data.recommendedActions.map((action, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      return `- [ ] **Step ${num}**: ${action}`;
    }),
    ``,
    `---`,
    ``,
    `## 5. Detected Architecture`,
    ``,
    `* **Languages**: ${data.languages && data.languages.length > 0 ? data.languages.join(', ') : 'None detected'}`,
    `* **Frameworks**: ${data.frameworks && data.frameworks.length > 0 ? data.frameworks.join(', ') : 'None detected'}`,
    `* **Build & Container Systems**: ${data.buildSystem && data.buildSystem.length > 0 ? data.buildSystem.join(', ') : 'None detected'}`,
    `* **Databases**: ${data.databasesList && data.databasesList.length > 0 ? data.databasesList.join(', ') : 'None detected'}`,
    `* **External Services**: ${data.externalServicesList && data.externalServicesList.length > 0 ? data.externalServicesList.join(', ') : 'None detected'}`,
    ``,
    `---`,
    ``,
    `## 6. Analysis Confidence & Limitations`,
    ``,
    `* **Confidence Level**: **${data.analysisConfidence}**`,
    ``,
    `### Detection Sources`,
    ...(data.confidenceSources && data.confidenceSources.length > 0
      ? data.confidenceSources.map(s => `- ✓ ${s}`)
      : ['- ✓ File structure & AST import statements', '- ✓ Package dependency manifests', '- ✓ Route & OpenAPI definitions']),
    ``,
    `### Known Static Analysis Limitations`,
    ...(data.confidenceLimitations && data.confidenceLimitations.length > 0
      ? data.confidenceLimitations.map(l => `- – ${l}`)
      : [
          '- – Runtime-generated dynamic dependencies and reflected class imports',
          '- – Environment-specific infrastructure and secret injections',
          '- – Dynamically constructed URL parameters and client-side proxies'
        ]),
    ``,
    `---`,
    `*Generated automatically by ChangeGuard Impact Intelligence Engine.*`
  ];

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanName = data.project.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  link.download = `changeguard-analysis-${cleanName}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
