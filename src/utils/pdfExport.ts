import { jsPDF } from 'jspdf';

export interface AnalysisExportData {
  title: string;
  project: string;
  analysisDate: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  blastRadius: string;
  directImpact: string[];
  indirectImpact: string[];
  detectedDependencies: string[];
  riskFactors: string[];
  why: string;
  recommendedActions: string[];
  analysisConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceSources?: string[];
  confidenceLimitations?: string[];
  detectedTechnologies: string[];
  languages?: string[];
  frameworks?: string[];
  buildSystem?: string[];
  databasesList?: string[];
  externalServicesList?: string[];
  filesAnalyzed: number;
  dependencies: number;
  apisDetected: number;
  databaseReferences: number;
  externalServices: number;
  affectedComponents: number;
  dependencyDepth?: number;
  changeRequest: {
    changeType: string;
    targetComponent: string;
    description: string;
    diffContent?: string | null;
  };
  rippleChain?: { source: string; target: string; type?: string }[];
}

/**
 * Generates an enterprise-grade multi-page PDF report for ChangeGuard
 */
export function exportAnalysisToPDF(data: AnalysisExportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 20;
  const contentWidth = pageWidth - margin * 2; // 170mm

  // Color palette (Enterprise clean report style matching ChangeGuard brand)
  const primaryPurple: [number, number, number] = [147, 51, 234]; // #9333ea
  const darkText: [number, number, number] = [15, 23, 42]; // #0f172a
  const mutedText: [number, number, number] = [100, 116, 139]; // #64748b
  const cardBg: [number, number, number] = [248, 250, 252]; // #f8fafc
  const cardBorder: [number, number, number] = [226, 232, 240]; // #e2e8f0

  const getRiskColor = (level: string): [number, number, number] => {
    switch (level) {
      case 'CRITICAL':
      case 'HIGH':
        return [220, 38, 38]; // #dc2626
      case 'MEDIUM':
        return [217, 119, 6]; // #d97706
      default:
        return [16, 185, 129]; // #10b981
    }
  };

  const riskColor = getRiskColor(data.riskLevel);

  // Helper for Header & Footer
  const addHeaderFooter = (pageNumber: number, totalPages: number) => {
    if (pageNumber === 1) return; // Cover page doesn't have standard running header

    // Running Header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.text('CHANGEGUARD PRE-DEPLOYMENT IMPACT REPORT', margin, 12);
    doc.text(data.project.toUpperCase(), pageWidth - margin, 12, { align: 'right' });

    doc.setDrawColor(...cardBorder);
    doc.setLineWidth(0.3);
    doc.line(margin, 15, pageWidth - margin, 15);

    // Running Footer
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    doc.setFontSize(8);
    doc.text('CONFIDENTIAL & AUTOMATED IMPACT ASSESSMENT', margin, pageHeight - 10);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // Helper to draw a section header
  const drawPageTitle = (title: string, subtitle?: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...darkText);
    doc.text(title, margin, 28);

    // Accent line under title
    doc.setDrawColor(...primaryPurple);
    doc.setLineWidth(0.8);
    doc.line(margin, 31, margin + 24, 31);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...mutedText);
      doc.text(subtitle, margin, 38);
    }
  };

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  // Background subtle decorative accent block
  doc.setFillColor(250, 245, 255); // faint purple tint
  doc.rect(0, 0, pageWidth, 90, 'F');

  doc.setFillColor(...primaryPurple);
  doc.rect(margin, 45, 8, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...darkText);
  doc.text('CHANGEGUARD', margin + 14, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryPurple);
  doc.text('PRE-DEPLOYMENT IMPACT ANALYSIS', margin, 68);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...mutedText);
  doc.text('"Know the blast radius before you deploy."', margin, 75);

  // Purple accent divider
  doc.setDrawColor(...primaryPurple);
  doc.setLineWidth(1.2);
  doc.line(margin, 90, pageWidth - margin, 90);

  // Metadata block
  const coverMetaY = 125;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('TARGET PROJECT', margin, coverMetaY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...darkText);
  doc.text(data.project, margin, coverMetaY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('ANALYSIS DATE', margin, coverMetaY + 28);

  doc.setFont('courier', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...darkText);
  const formattedDate = new Date(data.analysisDate).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'medium'
  });
  doc.text(formattedDate, margin, coverMetaY + 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('ANALYSIS STATUS', margin, coverMetaY + 52);

  doc.setFillColor(240, 253, 244); // light green bg
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, coverMetaY + 56, 36, 7, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52); // green
  doc.text('● COMPLETED', margin + 5, coverMetaY + 61);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('TARGET SERVICE / MODULE', margin, coverMetaY + 76);

  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkText);
  doc.text(data.changeRequest.targetComponent, margin, coverMetaY + 83);

  // Bottom Security / Notice footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('This automated verification report was compiled by ChangeGuard Static Dependency Analyzer.', margin, pageHeight - 25);
  doc.text('Evaluated against live service topology, module routes, and dependency graph boundaries.', margin, pageHeight - 20);

  // ==========================================
  // PAGE 2: EXECUTIVE SUMMARY
  // ==========================================
  doc.addPage();
  drawPageTitle('EXECUTIVE SUMMARY', 'High-level pre-deployment risk evaluation and blast radius breakdown.');

  // Prominent Risk Block
  const riskBoxY = 48;
  doc.setFillColor(...cardBg);
  doc.setDrawColor(...riskColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, riskBoxY, contentWidth, 38, 3, 3, 'FD');

  // Left side: Risk Level Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('OVERALL RISK LEVEL', margin + 8, riskBoxY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...riskColor);
  doc.text(`${data.riskLevel} RISK`, margin + 8, riskBoxY + 23);

  // Middle: Risk Score Index
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('RISK INDEX', margin + 70, riskBoxY + 11);

  doc.setFont('courier', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...darkText);
  doc.text(`${data.riskScore} / 100`, margin + 70, riskBoxY + 23);

  // Right side: Blast Radius
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('BLAST RADIUS', margin + 122, riskBoxY + 11);

  doc.setFont('courier', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...primaryPurple);
  doc.text(`${data.affectedComponents} COMPONENTS`, margin + 122, riskBoxY + 23);

  // Proposed Change Summary Card
  const changeCardY = riskBoxY + 46;
  doc.setFillColor(...cardBg);
  doc.setDrawColor(...cardBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, changeCardY, contentWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkText);
  doc.text('PROPOSED CHANGE SUMMARY', margin + 6, changeCardY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('TYPE:', margin + 6, changeCardY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  doc.text(data.changeRequest.changeType, margin + 26, changeCardY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('TARGET:', margin + 6, changeCardY + 26);
  doc.setFont('courier', 'bold');
  doc.setTextColor(...primaryPurple);
  doc.text(data.changeRequest.targetComponent, margin + 26, changeCardY + 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('CONTEXT:', margin + 6, changeCardY + 34);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  const descLines = doc.splitTextToSize(data.changeRequest.description || 'No description provided.', contentWidth - 32);
  doc.text(descLines[0] || '', margin + 26, changeCardY + 34);

  // Metrics Grid (Files, Dependencies, APIs, Databases, External Services)
  const metricsY = changeCardY + 52;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkText);
  doc.text('SYSTEM METRICS INSPECTED', margin, metricsY);

  const metricColWidth = contentWidth / 3;
  const metricsList = [
    { label: 'FILES ANALYZED', val: String(data.filesAnalyzed) },
    { label: 'DEPENDENCIES', val: String(data.dependencies) },
    { label: 'APIs DETECTED', val: String(data.apisDetected) },
    { label: 'DATABASES', val: String(data.databaseReferences) },
    { label: 'EXTERNAL SERVICES', val: String(data.externalServices) },
    { label: 'AFFECTED COMPONENTS', val: String(data.affectedComponents) }
  ];

  metricsList.forEach((m, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = margin + col * metricColWidth;
    const y = metricsY + 8 + row * 26;

    doc.setFillColor(...cardBg);
    doc.setDrawColor(...cardBorder);
    doc.roundedRect(x, y, metricColWidth - 4, 22, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedText);
    doc.text(m.label, x + 5, y + 7);

    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...darkText);
    doc.text(m.val, x + 5, y + 17);
  });

  // ==========================================
  // PAGE 3: IMPACT ANALYSIS
  // ==========================================
  doc.addPage();
  drawPageTitle('IMPACT ANALYSIS', 'Direct and cascading downstream component blast radius mapping.');

  let impactY = 46;

  // Direct Impact
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkText);
  doc.text(`DIRECT IMPACT (${data.directImpact.length} COMPONENT${data.directImpact.length === 1 ? '' : 'S'})`, margin, impactY);

  impactY += 6;
  if (data.directImpact.length > 0) {
    data.directImpact.forEach(comp => {
      doc.setFillColor(...cardBg);
      doc.setDrawColor(...primaryPurple);
      doc.roundedRect(margin, impactY, contentWidth, 9, 1, 1, 'FD');

      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...primaryPurple);
      doc.text(`• ${comp}`, margin + 6, impactY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedText);
      doc.text('[Direct consumer / caller]', pageWidth - margin - 40, impactY + 6);
      impactY += 12;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...mutedText);
    doc.text('No direct downstream consumers detected for this module.', margin, impactY + 4);
    impactY += 12;
  }

  // Indirect Impact
  impactY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkText);
  doc.text(`INDIRECT IMPACT (${data.indirectImpact.length} COMPONENT${data.indirectImpact.length === 1 ? '' : 'S'})`, margin, impactY);

  impactY += 6;
  if (data.indirectImpact.length > 0) {
    data.indirectImpact.forEach(comp => {
      doc.setFillColor(...cardBg);
      doc.setDrawColor(...cardBorder);
      doc.roundedRect(margin, impactY, contentWidth, 9, 1, 1, 'FD');

      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkText);
      doc.text(`• ${comp}`, margin + 6, impactY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedText);
      doc.text('[Cascading downstream]', pageWidth - margin - 40, impactY + 6);
      impactY += 12;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...mutedText);
    doc.text('No cascading secondary dependencies affected.', margin, impactY + 4);
    impactY += 12;
  }

  // Dependency Tree Representation
  impactY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkText);
  doc.text('DEPENDENCY RIPPLE FLOW', margin, impactY);

  impactY += 6;
  const rippleBoxY = impactY;
  const rippleBoxHeight = 58;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...cardBorder);
  doc.roundedRect(margin, rippleBoxY, contentWidth, rippleBoxHeight, 2, 2, 'FD');

  let flowY = rippleBoxY + 12;
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryPurple);
  doc.text(`[TARGET] ${data.changeRequest.targetComponent}`, margin + 12, flowY);

  flowY += 8;
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedText);
  doc.text('   │   (Direct contract invocation)', margin + 12, flowY);
  flowY += 5;
  doc.text('   ▼', margin + 12, flowY);

  flowY += 6;
  const directLabel = data.directImpact.length > 0 ? data.directImpact.slice(0, 3).join(', ') : 'No direct dependents';
  doc.setFont('courier', 'bold');
  doc.setTextColor(...darkText);
  doc.text(`[DIRECT] ${directLabel}`, margin + 12, flowY);

  if (data.indirectImpact.length > 0) {
    flowY += 8;
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mutedText);
    doc.text('   │   (Secondary cascade)', margin + 12, flowY);
    flowY += 5;
    doc.text('   ▼', margin + 12, flowY);

    flowY += 6;
    const indirectLabel = data.indirectImpact.slice(0, 3).join(', ');
    doc.setFont('courier', 'normal');
    doc.setTextColor(194, 65, 12); // orange
    doc.text(`[CASCADE] ${indirectLabel}`, margin + 12, flowY);
  }

  // ==========================================
  // PAGE 4: WHY IS THIS RISKY?
  // ==========================================
  doc.addPage();
  drawPageTitle('WHY IS THIS RISKY?', 'Algorithmic breakdown of detected risk factors, contracts, and incident precedents.');

  let whyY = 48;
  data.riskFactors.forEach((factor, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    doc.setFillColor(...cardBg);
    doc.setDrawColor(...cardBorder);
    doc.roundedRect(margin, whyY, contentWidth, 24, 2, 2, 'FD');

    // Index pill
    doc.setFillColor(243, 232, 255); // faint purple
    doc.roundedRect(margin + 4, whyY + 4, 10, 8, 1, 1, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryPurple);
    doc.text(num, margin + 5.5, whyY + 9.5);

    // Factor header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...darkText);
    doc.text(factor, margin + 18, whyY + 9);

    // Explanation text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    let explanation = 'Evaluated against runtime contracts and static dependency analysis.';
    if (factor.toLowerCase().includes('breaking')) {
      explanation = 'The API or schema definition alters expected return structures, requiring coordinated consumer updates.';
    } else if (factor.toLowerCase().includes('directly')) {
      explanation = 'Immediate upstream callers depend on current payload shapes and will fail if modified without fallbacks.';
    } else if (factor.toLowerCase().includes('downstream')) {
      explanation = 'Cascading latency spikes or timeouts could ripple into secondary consumer modules.';
    } else if (factor.toLowerCase().includes('critical')) {
      explanation = 'Identified directly on the critical user-facing traffic path where outages cause immediate disruption.';
    } else if (factor.toLowerCase().includes('database')) {
      explanation = 'Modifies or writes to relational persistence layers with strict locking and transactional invariants.';
    }
    const lines = doc.splitTextToSize(explanation, contentWidth - 24);
    doc.text(lines, margin + 18, whyY + 16);

    whyY += 30;
  });

  // ==========================================
  // PAGE 5: RECOMMENDED ACTIONS
  // ==========================================
  doc.addPage();
  drawPageTitle('RECOMMENDED ACTIONS', 'Targeted pre-deployment validation checklist tailored to the calculated blast radius.');

  let actionY = 48;
  data.recommendedActions.forEach((action, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    doc.setFillColor(...cardBg);
    doc.setDrawColor(...cardBorder);
    doc.roundedRect(margin, actionY, contentWidth, 20, 2, 2, 'FD');

    // Checkbox box
    doc.setDrawColor(...primaryPurple);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin + 6, actionY + 6, 6, 6, 1, 1, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryPurple);
    doc.text(`STEP ${num}`, margin + 17, actionY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    const actionLines = doc.splitTextToSize(action, contentWidth - 24);
    doc.text(actionLines, margin + 17, actionY + 14);

    actionY += 26;
  });

  // Verification note
  actionY += 6;
  doc.setFillColor(245, 243, 255);
  doc.setDrawColor(221, 214, 254);
  doc.roundedRect(margin, actionY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryPurple);
  doc.text('DEPLOYMENT SAFETY PROTOCOL', margin + 6, actionY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkText);
  doc.text(
    `Completing these ${data.recommendedActions.length} recommended verification steps before deploying ${data.changeRequest.targetComponent} significantly mitigates unexpected production incidents and cascading rollbacks.`,
    margin + 6,
    actionY + 14,
    { maxWidth: contentWidth - 12 }
  );

  // ==========================================
  // PAGE 6: DETECTED ARCHITECTURE
  // ==========================================
  doc.addPage();
  drawPageTitle('DETECTED ARCHITECTURE', 'Technology stack, persistent storage, and infrastructure components identified.');

  let archY = 48;

  const archSections = [
    { title: 'LANGUAGES', items: data.languages || ['JavaScript / TypeScript'] },
    { title: 'FRAMEWORKS', items: data.frameworks || ['Node.js / Express'] },
    { title: 'BUILD & CONTAINER SYSTEMS', items: data.buildSystem || ['npm / Docker'] },
    { title: 'DATABASES', items: data.databasesList || ['PostgreSQL', 'Redis'] },
    { title: 'EXTERNAL SERVICES', items: data.externalServicesList || ['Third-party APIs'] }
  ];

  archSections.forEach(section => {
    doc.setFillColor(...cardBg);
    doc.setDrawColor(...cardBorder);
    doc.roundedRect(margin, archY, contentWidth, 22, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedText);
    doc.text(section.title, margin + 6, archY + 7);

    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...darkText);
    const content = section.items.join(', ') || 'None detected';
    doc.text(content, margin + 6, archY + 16);

    archY += 28;
  });

  // ==========================================
  // PAGE 7: ANALYSIS CONFIDENCE
  // ==========================================
  doc.addPage();
  drawPageTitle('ANALYSIS CONFIDENCE', 'Methodology transparency, detection sources, and static analysis boundaries.');

  let confY = 48;

  // Confidence Rating Box
  doc.setFillColor(...cardBg);
  doc.setDrawColor(...cardBorder);
  doc.roundedRect(margin, confY, contentWidth, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('STATIC ANALYSIS CONFIDENCE LEVEL', margin + 6, confY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...primaryPurple);
  doc.text(data.analysisConfidence, margin + 6, confY + 20);

  confY += 36;

  // Why (Sources)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkText);
  doc.text('DETECTION SOURCES (HOW THIS WAS DERIVED)', margin, confY);

  confY += 6;
  const sources = data.confidenceSources && data.confidenceSources.length > 0 
    ? data.confidenceSources 
    : ['TypeScript / JavaScript AST import analysis', 'package.json dependencies', 'OpenAPI / REST route contracts', 'Docker Compose definitions'];

  sources.forEach(src => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52); // green check
    doc.text('✓', margin + 4, confY + 4);

    doc.setTextColor(...darkText);
    doc.text(src, margin + 12, confY + 4);
    confY += 8;
  });

  confY += 12;

  // Limitations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkText);
  doc.text('STATIC ANALYSIS LIMITATIONS & BOUNDARIES', margin, confY);

  confY += 6;
  const limitations = data.confidenceLimitations && data.confidenceLimitations.length > 0
    ? data.confidenceLimitations
    : [
        'Runtime-generated dynamic dependencies and reflected class imports',
        'Environment-specific infrastructure and secret injections',
        'Dynamically constructed URL parameters and client-side SDK proxies',
        'Third-party cloud SaaS infrastructure without local schema definitions'
      ];

  limitations.forEach(lim => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedText);
    doc.text('–', margin + 4, confY + 4);
    doc.text(lim, margin + 12, confY + 4);
    confY += 8;
  });

  confY += 10;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...cardBorder);
  doc.roundedRect(margin, confY, contentWidth, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text(
    'ChangeGuard prioritizes safety through conservative blast radius estimation. Where static resolution is ambiguous, consumer contracts are flagged to prevent unmonitored production outages.',
    margin + 6,
    confY + 8,
    { maxWidth: contentWidth - 12 }
  );

  // Apply running Header and Footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderFooter(i, totalPages);
  }

  // Trigger download
  const cleanName = data.project.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  doc.save(`changeguard-analysis-${cleanName}.pdf`);
}
