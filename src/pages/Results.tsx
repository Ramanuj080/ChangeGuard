import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import DependencyGraph from '../components/DependencyGraph';
import { AnalysisResult, AnalysisRequest } from '../utils/riskEngine';
import { AlertTriangle, CheckCircle, ShieldAlert, ArrowLeft, Download, FileText, Server, Database, Cloud, X, Copy, Check, FileCode, Code, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { exportAnalysisToPDF, AnalysisExportData } from '../utils/pdfExport';
import { exportAnalysisToMarkdown } from '../utils/markdownExport';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProject, lastAnalysis } = useProject();
  const [animateGraph, setAnimateGraph] = useState(false);
  const [showTestPlan, setShowTestPlan] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedPlan, setCopiedPlan] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Use state from navigation or fallback to persistent lastAnalysis in ProjectContext
  const result: AnalysisResult | undefined = location.state?.result || lastAnalysis?.result;
  const request: AnalysisRequest | undefined = location.state?.request || lastAnalysis?.request;

  useEffect(() => {
    if (!result || !request) {
      navigate('/analyze');
      return;
    }
    // Delay graph highlight animation slightly for effect
    const t = setTimeout(() => setAnimateGraph(true), 500);
    return () => clearTimeout(t);
  }, [result, request, navigate]);

  if (!result || !request) return null;

  const isHighRisk = result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL';
  const colorClass = isHighRisk ? 'text-red-500' : 'text-emerald-500';
  const bgClass = isHighRisk ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30';
  
  const allHighlightedIds = animateGraph ? [request.serviceId, ...result.affectedServices, ...result.databasesAffected, ...result.externalAffected] : [request.serviceId];

  // Helper to find node label from current project
  const getNodeLabel = (id: string) => {
    const node = currentProject.nodes.find(n => n.id === id);
    return node ? node.label : id;
  };

  const targetServiceName = getNodeLabel(request.serviceId);
  const directConsumerNames = result.directImpacts.map(id => getNodeLabel(id));
  const indirectConsumerNames = result.indirectImpacts.map(id => getNodeLabel(id));

  // Construct structured analysis data from CURRENT project & analysis
  const getAnalysisExportData = (): AnalysisExportData => {
    return {
      title: "CHANGEGUARD Project Impact Analysis",
      project: currentProject.name,
      analysisDate: new Date().toISOString(),
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      blastRadius: `${result.affectedServices.length} components`,
      directImpact: directConsumerNames,
      indirectImpact: indirectConsumerNames,
      detectedDependencies: currentProject.rawDependencies || currentProject.edges.map(e => `${getNodeLabel(e.source)} -> ${getNodeLabel(e.target)}`),
      riskFactors: result.reasons,
      why: result.reasons.join("; "),
      recommendedActions: result.recommendedActions,
      analysisConfidence: currentProject.confidence.level,
      confidenceSources: currentProject.confidence.detectedFrom,
      confidenceLimitations: currentProject.confidence.potentiallyIncomplete,
      detectedTechnologies: [
        ...currentProject.technology.languages,
        ...currentProject.technology.frameworks,
        ...currentProject.technology.buildSystem,
        ...currentProject.technology.databases
      ],
      languages: currentProject.technology.languages,
      frameworks: currentProject.technology.frameworks,
      buildSystem: currentProject.technology.buildSystem,
      databasesList: currentProject.databasesList || currentProject.technology.databases,
      externalServicesList: currentProject.externalServicesList,
      filesAnalyzed: currentProject.stats.filesAnalyzed,
      dependencies: currentProject.stats.dependenciesCount,
      apisDetected: currentProject.stats.apisDetected,
      databaseReferences: currentProject.stats.databaseReferences,
      externalServices: currentProject.stats.externalServices,
      affectedComponents: result.affectedServices.length,
      dependencyDepth: result.dependencyDepth,
      changeRequest: {
        changeType: request.changeType,
        targetComponent: targetServiceName,
        description: request.description,
        diffContent: request.diffContent || null
      }
    };
  };

  // 1. JSON Export
  const handleExportJSON = () => {
    try {
      const data = getAnalysisExportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = currentProject.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      link.download = `changeguard-analysis-${cleanName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowExportModal(false);
      setToastMessage('Analysis exported successfully.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      setToastMessage('Unable to generate JSON export.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // 2. PDF Export
  const handleExportPDF = () => {
    try {
      const data = getAnalysisExportData();
      exportAnalysisToPDF(data);
      setShowExportModal(false);
      setToastMessage('PDF report generated successfully.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('PDF export error:', err);
      setShowExportModal(false);
      setToastMessage('Unable to generate PDF report. Please try again.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // 3. Markdown Export
  const handleExportMarkdown = () => {
    try {
      const data = getAnalysisExportData();
      exportAnalysisToMarkdown(data);
      setShowExportModal(false);
      setToastMessage('Markdown report exported successfully.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('Markdown export error:', err);
      setShowExportModal(false);
      setToastMessage('Unable to generate Markdown report.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Construct dynamic test plan text
  const generateTestPlanText = () => {
    const lines = [
      `CHANGEGUARD PRE-DEPLOYMENT TEST PLAN`,
      `Target Project: ${currentProject.name}`,
      `Target Component: ${targetServiceName}`,
      `Change Type: ${request.changeType}`,
      `Risk Assessment: ${result.riskLevel} (${result.riskScore}/100)`,
      `Generated: ${new Date().toLocaleString()}`,
      `--------------------------------------------------`,
      ``,
      `1. API Contract & Schema Tests`,
      `   - Verify that all direct consumers (${directConsumerNames.length > 0 ? directConsumerNames.join(', ') : 'downstream callers'}) maintain schema compatibility.`,
      `   - Test payload serialization and backward-compatible default fields for ${targetServiceName}.`,
      ``,
      `2. Service Integration Tests`,
      `   - Execute end-to-end integration: ${targetServiceName} → ${directConsumerNames.length > 0 ? directConsumerNames.join(', ') : 'dependent modules'}.`,
      `   - Verify timeout and circuit-breaker behaviors under simulated downstream latency.`,
      ``,
      `3. Regression & Workflow Tests`,
      `   - Run regression test suites covering primary transactional paths involving ${targetServiceName}.`,
      `   - Validate error response formats and client error handling codes.`,
      ``,
      `4. Dependency Ripple Validation`,
      `   - Validate cascading downstream services (${indirectConsumerNames.length > 0 ? indirectConsumerNames.join(', ') : 'secondary layers'}).`,
      `   - Check distributed trace spans and telemetry headers across service hops.`,
      ``
    ];

    if (result.databasesAffected.length > 0) {
      lines.push(
        `5. Database & State Verification`,
        `   - Validate read/write consistency with storage references (${result.databasesAffected.map(getNodeLabel).join(', ')}).`,
        `   - Execute non-blocking migration validation and rollback script rehearsals.`,
        ``
      );
    }

    lines.push(
      `${result.databasesAffected.length > 0 ? '6' : '5'}. Staging & Canary Deployment`,
      `   - Deploy artifact to staging environment and execute sanity test suite.`,
      `   - Initialize production canary deployment with 5% traffic routing for 15 minutes.`,
      ``,
      `${result.databasesAffected.length > 0 ? '7' : '6'}. Critical Endpoint Smoke Tests`,
      `   - Execute automated synthetic probes on all public and internal endpoints of ${targetServiceName}.`,
      `   - Verify error rates and P99 latency within SLO thresholds before full traffic migration.`
    );

    return lines.join('\n');
  };

  const handleCopyTestPlan = () => {
    const text = generateTestPlanText();
    navigator.clipboard.writeText(text);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2000);
  };

  const handleDownloadTestPlan = () => {
    const text = generateTestPlanText();
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = currentProject.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    link.download = `changeguard-test-plan-${cleanName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl glass-panel border border-emerald-500/40 bg-background/90 text-emerald-400 text-sm font-medium shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/analyze')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analysis
        </button>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 glass-panel hover:bg-secondary rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Analysis
          </button>
          <button 
            onClick={() => setShowTestPlan(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Generate Test Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Risk Summary */}
        <div className="space-y-6">
          <div className={cn("p-8 rounded-2xl border backdrop-blur-md relative overflow-hidden", bgClass)}>
            <div className={cn("absolute inset-0 opacity-20 blur-2xl rounded-full", isHighRisk ? "bg-red-500" : "bg-emerald-500")} />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              {isHighRisk ? (
                <ShieldAlert className={cn("w-16 h-16", colorClass)} />
              ) : (
                <CheckCircle className={cn("w-16 h-16", colorClass)} />
              )}
              
              <div>
                <h2 className={cn("text-3xl font-bold tracking-widest", colorClass)}>{result.riskLevel} RISK</h2>
                <p className="text-muted-foreground text-sm mt-1">Impact Analysis Complete</p>
              </div>
              
              <div className="w-full pt-6 border-t border-border/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Risk Index</span>
                  <span className="text-2xl font-bold font-mono">{result.riskScore}/100</span>
                </div>
                <div className="w-full h-2 bg-background/50 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", isHighRisk ? "bg-red-500" : "bg-emerald-500")} 
                    style={{ width: `${result.riskScore}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-border space-y-6">
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">
              Blast Radius Breakdown
            </h3>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="text-2xl font-bold font-mono">{result.affectedServices.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Components</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="text-2xl font-bold font-mono">{result.databasesAffected.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Databases</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="text-2xl font-bold font-mono">{result.externalAffected.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">External</div>
              </div>
            </div>
            
            {result.affectedServices.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border/50">
                {result.directImpacts.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-primary block mb-2">Direct Impact ({result.directImpacts.length})</span>
                    <div className="flex flex-wrap gap-2">
                      {result.directImpacts.map(id => (
                        <span key={id} className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded text-xs font-mono flex items-center gap-1.5 text-primary">
                          <Server className="w-3 h-3" />
                          {getNodeLabel(id)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {result.indirectImpacts.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-orange-400 block mb-2">Indirect Impact ({result.indirectImpacts.length})</span>
                    <div className="flex flex-wrap gap-2">
                      {result.indirectImpacts.map(id => (
                        <span key={id} className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-xs font-mono flex items-center gap-1.5 text-orange-300">
                          <Server className="w-3 h-3" />
                          {getNodeLabel(id)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Graph & Reasons */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-[400px] glow-border rounded-xl p-1 relative overflow-hidden bg-card/40">
            <DependencyGraph 
              nodes={currentProject.nodes}
              edges={currentProject.edges}
              sourceNodeId={request.serviceId}
              highlightedNodeIds={allHighlightedIds}
              interactive={true}
              animatedEdges={animateGraph}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-xl border border-border">
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-6 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Why? (Detected Causes)
              </h3>
              
              <div className="space-y-6">
                {result.reasons.map((reason, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="text-xl font-bold font-mono text-muted-foreground/30 leading-none">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{reason}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reason.includes('breaking') ? 'The API or module contract change modifies expected structures which requires downstream updates.' : 
                         reason.includes('Directly') ? 'Immediate upstream callers rely on the current behavior and must be validated against the new interface.' :
                         reason.includes('Possible downstream') ? 'Cascading failures or timeouts could ripple into secondary modules.' :
                         reason.includes('critical') ? 'Identified on the critical traffic path where downtime affects primary user operations.' :
                         'This change follows safe patterns with minimal downstream consequences.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl border border-border">
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-6 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Recommended Actions
              </h3>
              
              <div className="space-y-3">
                {result.recommendedActions.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="mt-0.5 min-w-[16px]">
                      <div className="w-4 h-4 rounded-full border border-muted-foreground flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-transparent hover:bg-primary transition-colors cursor-pointer" />
                      </div>
                    </div>
                    <span className="text-sm">{action}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20 flex flex-col gap-2">
                <span className="text-xs font-semibold text-primary uppercase tracking-widest">AI Context Note</span>
                <p className="text-xs text-primary/80 leading-relaxed">
                  Based on detected dependencies in {currentProject.name}, executing the recommended contract validation tests before deploying {getNodeLabel(request.serviceId)} mitigates estimated cascading risk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Test Plan Modal */}
      {showTestPlan && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowTestPlan(false)}
        >
          <div 
            className="w-full max-w-2xl glass-panel glow-border rounded-2xl border border-border p-6 space-y-6 max-h-[85vh] flex flex-col bg-card/95 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary font-bold block mb-1">
                  ChangeGuard Automated Testing
                </span>
                <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
                  Pre-Deployment Test Plan
                  <span className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-mono font-medium",
                    isHighRisk ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  )}>
                    {result.riskLevel} RISK ({result.riskScore}/100)
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setShowTestPlan(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm font-sans">
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 text-xs font-mono text-muted-foreground space-y-1">
                <div>Target Service: <span className="text-foreground font-semibold">{targetServiceName}</span></div>
                <div>Change Type: <span className="text-foreground font-semibold">{request.changeType}</span></div>
                <div>Impacted Services: <span className="text-primary font-semibold">{result.affectedServices.length}</span></div>
              </div>

              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-xl bg-secondary/20 border border-border/60 space-y-2">
                  <div className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-primary/20 text-primary flex items-center justify-center font-mono text-xs">1</span>
                    API Contract & Schema Tests
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                    Verify that all direct consumers ({directConsumerNames.length > 0 ? directConsumerNames.join(', ') : 'downstream callers'}) maintain schema compatibility. Test payload serialization and backward-compatible default fields for {targetServiceName}.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/20 border border-border/60 space-y-2">
                  <div className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-primary/20 text-primary flex items-center justify-center font-mono text-xs">2</span>
                    Service Integration Tests
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                    Execute end-to-end integration: {targetServiceName} → {directConsumerNames.length > 0 ? directConsumerNames.join(', ') : 'dependent modules'}. Verify timeout and circuit-breaker behaviors under simulated downstream latency.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/20 border border-border/60 space-y-2">
                  <div className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-primary/20 text-primary flex items-center justify-center font-mono text-xs">3</span>
                    Regression & Workflow Tests
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                    Run regression test suites covering primary transactional paths involving {targetServiceName}. Validate error response formats and client error handling codes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/20 border border-border/60 space-y-2">
                  <div className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-primary/20 text-primary flex items-center justify-center font-mono text-xs">4</span>
                    Dependency Ripple Validation
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                    Validate cascading downstream services ({indirectConsumerNames.length > 0 ? indirectConsumerNames.join(', ') : 'secondary layers'}). Check distributed trace spans and telemetry headers across service hops.
                  </p>
                </div>

                {result.databasesAffected.length > 0 && (
                  <div className="p-4 rounded-xl bg-secondary/20 border border-border/60 space-y-2">
                    <div className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-xs">5</span>
                      Database & State Verification
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                      Validate read/write consistency with storage references ({result.databasesAffected.map(getNodeLabel).join(', ')}). Execute non-blocking migration validation and rollback script rehearsals.
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-secondary/20 border border-border/60 space-y-2">
                  <div className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-primary/20 text-primary flex items-center justify-center font-mono text-xs">
                      {result.databasesAffected.length > 0 ? '6' : '5'}
                    </span>
                    Staging & Canary Deployment
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                    Deploy artifact to staging environment and execute sanity test suite. Initialize production canary deployment with 5% traffic routing for 15 minutes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/20 border border-border/60 space-y-2">
                  <div className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-primary/20 text-primary flex items-center justify-center font-mono text-xs">
                      {result.databasesAffected.length > 0 ? '7' : '6'}
                    </span>
                    Critical Endpoint Smoke Tests
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                    Execute automated synthetic probes on all public and internal endpoints of {targetServiceName}. Verify error rates and P99 latency within SLO thresholds before full traffic migration.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <button
                type="button"
                onClick={() => setShowTestPlan(false)}
                className="px-4 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyTestPlan}
                  className="flex items-center gap-1.5 px-4 py-2 glass-panel hover:bg-secondary rounded-lg text-xs font-medium transition-colors cursor-pointer text-foreground"
                >
                  {copiedPlan ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPlan ? 'Copied to Clipboard!' : 'Copy Test Plan'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTestPlan}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Test Plan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Format Selection Modal */}
      {showExportModal && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowExportModal(false)}
        >
          <div 
            className="w-full max-w-sm glass-panel glow-border rounded-2xl border border-border p-6 space-y-6 bg-card/95 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary font-bold block mb-1">
                  Export Analysis
                </span>
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  Choose format:
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {/* PDF Report Option */}
              <button
                type="button"
                onClick={handleExportPDF}
                className="w-full p-4 rounded-xl glass-panel border border-border hover:border-primary/60 hover:bg-primary/10 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary/20 group-hover:scale-105 transition-all">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      PDF Report
                    </div>
                    <div className="text-[11px] text-muted-foreground font-light">
                      Enterprise multi-page report (.pdf)
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">
                  →
                </span>
              </button>

              {/* JSON Data Option */}
              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full p-4 rounded-xl glass-panel border border-border hover:border-primary/60 hover:bg-primary/10 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-foreground group-hover:text-primary transition-all">
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      JSON Data
                    </div>
                    <div className="text-[11px] text-muted-foreground font-light">
                      Full machine-readable model (.json)
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">
                  →
                </span>
              </button>

              {/* Markdown Option */}
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="w-full p-4 rounded-xl glass-panel border border-border hover:border-primary/60 hover:bg-primary/10 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-foreground group-hover:text-primary transition-all">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      Markdown
                    </div>
                    <div className="text-[11px] text-muted-foreground font-light">
                      GitHub-formatted summary (.md)
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">
                  →
                </span>
              </button>
            </div>

            <div className="border-t border-border/50 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="w-full py-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer text-center font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
