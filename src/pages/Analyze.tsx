import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { analyzeChange } from '../utils/riskEngine';
import { GitBranch, Play, Terminal, CheckCircle2, Loader2, FileCode2, Upload, FileUp } from 'lucide-react';
import { cn } from '../utils/cn';

const steps = [
  "Parsing change context...",
  "Resolving dependencies...",
  "Traversing architecture graph...",
  "Checking historical incidents...",
  "Calculating blast radius...",
  "Generating risk explanation..."
];

export default function Analyze() {
  const navigate = useNavigate();
  const { currentProject, setLastAnalysis } = useProject();

  const [activeTab, setActiveTab] = useState<'form' | 'diff' | 'diffUpload'>('form');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const initialServiceId = currentProject.nodes.find(n => n.type === 'service')?.id || currentProject.nodes[0]?.id || 'payment-service';

  const [formData, setFormData] = useState({
    changeType: 'API Change',
    serviceId: initialServiceId,
    description: '',
    diffContent: ''
  });

  // Keep target service updated if current project changes
  useEffect(() => {
    if (!currentProject.nodes.some(n => n.id === formData.serviceId)) {
      const fallbackId = currentProject.nodes.find(n => n.type === 'service')?.id || currentProject.nodes[0]?.id;
      if (fallbackId) {
        setFormData(prev => ({ ...prev, serviceId: fallbackId }));
      }
    }
  }, [currentProject]);

  useEffect(() => {
    let timer: any;
    if (isAnalyzing) {
      if (currentStep < steps.length) {
        timer = setTimeout(() => {
          setCurrentStep(prev => prev + 1);
        }, 800);
      } else {
        // Analysis complete, calculate with project topology and navigate
        const result = analyzeChange({
          changeType: formData.changeType,
          serviceId: formData.serviceId,
          description: formData.description,
          diffContent: formData.diffContent,
          nodes: currentProject.nodes,
          edges: currentProject.edges
        });
        
        setLastAnalysis({ result, request: formData });

        // Pass result via state
        setTimeout(() => {
          navigate('/results', { state: { result, request: formData } });
        }, 500);
      }
    }
    return () => clearTimeout(timer);
  }, [isAnalyzing, currentStep, navigate, formData, currentProject, setLastAnalysis]);

  const handleLoadHighRisk = () => {
    const target = currentProject.nodes.find(n => n.id.includes('payment') || n.type === 'service')?.id || currentProject.nodes[0]?.id;
    setFormData({
      changeType: 'API Change',
      serviceId: target,
      description: 'Remove customer_id from response and migrate consumers to customer_reference.',
      diffContent: '- customer_id: string;\n+ customer_reference: string;'
    });
    setActiveTab('form');
  };

  const handleLoadLowRisk = () => {
    const target = currentProject.nodes.find(n => n.id.includes('payment') || n.type === 'service')?.id || currentProject.nodes[0]?.id;
    setFormData({
      changeType: 'API Change',
      serviceId: target,
      description: 'Add optional customer_email field to API response.',
      diffContent: '+ customer_email?: string;'
    });
    setActiveTab('form');
  };

  const handleDiffFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        diffContent: text,
        description: prev.description || `Applied diff from ${file.name}`
      }));
      setActiveTab('diff');
    };
    reader.readAsText(file);
  };

  const startAnalysis = () => {
    if (!formData.description && !formData.diffContent) return;
    setIsAnalyzing(true);
    setCurrentStep(0);
  };

  if (isAnalyzing) {
    return (
      <div className="max-w-3xl mx-auto mt-20 p-8 glass-panel rounded-2xl glow-border relative overflow-hidden">
        <div className="flex flex-col items-center justify-center space-y-8 py-8">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">Analyzing Blast Radius</h2>
            <p className="text-sm text-muted-foreground font-mono">
              Evaluating proposed change against <span className="text-primary">{currentProject.name}</span> architecture
            </p>
          </div>

          <div className="w-full max-w-md space-y-3">
            {steps.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              
              return (
                <div 
                  key={step} 
                  className={cn(
                    "flex items-center gap-3 text-sm font-mono transition-all duration-300",
                    isDone ? "text-emerald-400" :
                    isCurrent ? "text-primary font-bold translate-x-1" :
                    "text-muted-foreground/40"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                  )}
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Analyze a Change</h1>
          <p className="text-muted-foreground text-sm">
            Evaluate a proposed pull request, API change, or configuration update against your architecture.
          </p>
        </div>

        {/* Current Active Project Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-border text-xs font-mono">
          <span className="text-muted-foreground">Target Project:</span>
          <span className="text-primary font-bold">{currentProject.name}</span>
          <button
            onClick={() => navigate('/upload')}
            className="text-[10px] text-muted-foreground hover:text-foreground underline ml-1 cursor-pointer"
          >
            Change
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-xl overflow-hidden border border-border">
            <div className="flex border-b border-border bg-secondary/30">
              <button 
                onClick={() => setActiveTab('form')}
                className={cn(
                  "px-6 py-3 text-xs font-mono font-medium transition-colors flex items-center gap-2 cursor-pointer",
                  activeTab === 'form' ? "bg-background text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Terminal className="w-4 h-4" />
                Change Context
              </button>
              <button 
                onClick={() => setActiveTab('diff')}
                className={cn(
                  "px-6 py-3 text-xs font-mono font-medium transition-colors flex items-center gap-2 cursor-pointer",
                  activeTab === 'diff' ? "bg-background text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileCode2 className="w-4 h-4" />
                Git Diff Editor
              </button>
              <button 
                onClick={() => setActiveTab('diffUpload')}
                className={cn(
                  "px-6 py-3 text-xs font-mono font-medium transition-colors flex items-center gap-2 cursor-pointer",
                  activeTab === 'diffUpload' ? "bg-background text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileUp className="w-4 h-4" />
                Upload Diff
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'form' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Change Type</label>
                      <select 
                        className="w-full bg-secondary/50 border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                        value={formData.changeType}
                        onChange={(e) => setFormData({...formData, changeType: e.target.value})}
                      >
                        <option>API Change</option>
                        <option>Configuration Change</option>
                        <option>Deployment</option>
                        <option>Infrastructure Change</option>
                        <option>Database Change</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Target Service / Module</label>
                      <select 
                        className="w-full bg-secondary/50 border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground font-mono"
                        value={formData.serviceId}
                        onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                      >
                        {currentProject.nodes.map(node => (
                          <option key={node.id} value={node.id}>{node.label} ({node.type})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Change Description (Natural Language)</label>
                    <textarea 
                      className="w-full bg-secondary/50 border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[140px] font-mono text-foreground placeholder:text-muted-foreground/50 resize-none"
                      placeholder="e.g., Remove customer_id from response payload and deprecate v1 route..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'diff' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Paste Raw Unified Git Diff</label>
                    <span className="text-[11px] font-mono text-muted-foreground">e.g. - old_prop / + new_prop</span>
                  </div>
                  <textarea
                    className="w-full bg-secondary/50 border border-border rounded-md p-4 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 h-[220px] resize-none"
                    placeholder="@@ -45,7 +45,7 @@&#10;- customer_id: string;&#10;+ customer_reference: string;"
                    value={formData.diffContent}
                    onChange={(e) => setFormData({ ...formData, diffContent: e.target.value, description: formData.description || 'Custom Git Diff Patch' })}
                  />
                </div>
              )}

              {activeTab === 'diffUpload' && (
                <div className="p-8 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center space-y-4 bg-secondary/20">
                  <Upload className="w-8 h-8 text-primary opacity-80" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Upload a .patch or .diff file</h4>
                    <p className="text-xs text-muted-foreground mt-1">Select a patch file generated from git diff</p>
                  </div>
                  <label className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-md text-xs font-mono text-primary cursor-pointer transition-colors">
                    <span>Browse Patch File</span>
                    <input type="file" accept=".patch,.diff,.txt" className="hidden" onChange={handleDiffFileUpload} />
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-4">
            <button 
              onClick={startAnalysis}
              disabled={!formData.description && !formData.diffContent}
              className="glow-border px-8 py-3 bg-primary text-primary-foreground rounded-md font-semibold tracking-wide hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              Analyze Impact
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-border">
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-4">Quick Load Examples</h3>
            
            <div className="space-y-3">
              <button 
                onClick={handleLoadHighRisk}
                className="w-full text-left p-4 rounded-lg bg-secondary/30 border border-border hover:border-red-500/50 hover:bg-red-500/5 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground group-hover:text-red-400 transition-colors">Breaking API Change</span>
                  <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 font-mono">HIGH RISK</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">Remove customer_id from response...</p>
              </button>

              <button 
                onClick={handleLoadLowRisk}
                className="w-full text-left p-4 rounded-lg bg-secondary/30 border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors">Backward Compatible</span>
                  <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono">LOW RISK</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">Add optional customer_email field...</p>
              </button>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-xl border border-border bg-primary/5">
            <div className="flex items-start gap-3">
              <GitBranch className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-primary mb-1">Graph Sync Active</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The risk engine evaluates your change against the active topology of <span className="font-mono text-foreground font-medium">{currentProject.name}</span> ({currentProject.nodes.length} nodes, {currentProject.edges.length} edges).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
