import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ShieldAlert, GitBranch, AlertOctagon, Settings, FileText, LayoutDashboard, Upload, X, Check, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { cn } from '../utils/cn';
import CursorGlow from './CursorGlow';
import Logo from './Logo';
import { useProject } from '../context/ProjectContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProject, hasCustomProject, lastAnalysis, settings, updateSettings, resetToDemo } = useProject();

  const [showDocModal, setShowDocModal] = useState(false);
  const [showArchModal, setShowArchModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const navItems = [
    { name: 'Overview', path: '/', icon: Activity },
    { name: 'Upload Project', path: '/upload', icon: Upload },
    { name: 'Analyze', path: '/analyze', icon: ShieldAlert },
    { name: 'Architecture', path: '/architecture', icon: GitBranch },
    { name: 'Incidents', path: '/incidents', icon: AlertOctagon },
  ];

  const handleGridIconClick = () => {
    if (hasCustomProject) {
      navigate('/architecture');
    } else {
      setShowArchModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern relative flex flex-col font-sans">
      <CursorGlow />
      <header className="sticky top-0 z-50 glass-panel border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Logo />
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium tracking-wide">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM OPERATIONAL
            </div>
            
            <div className="flex items-center gap-3">
              {/* Document Icon */}
              <button 
                type="button"
                onClick={() => setShowDocModal(true)}
                title="Analysis Summary & Reports"
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer"
              >
                <FileText className="w-5 h-5" />
              </button>

              {/* Grid Icon */}
              <button 
                type="button"
                onClick={handleGridIconClick}
                title="Architecture & Dependency Graph"
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>

              {/* Settings Icon */}
              <button 
                type="button"
                onClick={() => setShowSettingsModal(true)}
                title="Analysis & Display Settings"
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-6 py-8 relative">
        <Outlet />
      </main>

      {/* 1. DOCUMENT ICON MODAL: Analysis Summary */}
      {showDocModal && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowDocModal(false)}
        >
          <div 
            className="w-full max-w-md glass-panel glow-border rounded-2xl border border-border p-6 space-y-6 bg-card/95 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold tracking-tight text-foreground">Project Analysis Status</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!hasCustomProject && !lastAnalysis ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-border flex items-center justify-center mx-auto text-muted-foreground">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-foreground">No project analyzed yet.</h4>
                  <p className="text-xs text-muted-foreground font-light max-w-xs mx-auto">
                    Upload a codebase archive to generate dependency graphs, API routes, and pre-deployment impact assessments.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDocModal(false);
                    navigate('/upload');
                  }}
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  Upload Project
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-secondary/20 border border-border/60 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase font-semibold text-[10px]">Project</span>
                    <span className="font-mono text-foreground font-bold">{currentProject.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase font-semibold text-[10px]">Files Analyzed</span>
                    <span className="font-mono text-foreground">{currentProject.stats.filesAnalyzed}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase font-semibold text-[10px]">Dependencies</span>
                    <span className="font-mono text-foreground">{currentProject.stats.dependenciesCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase font-semibold text-[10px]">Risk</span>
                    <span className={cn(
                      "font-mono font-bold px-2 py-0.5 rounded text-[10px]",
                      lastAnalysis?.result.riskLevel === 'HIGH' || lastAnalysis?.result.riskLevel === 'CRITICAL'
                        ? "bg-red-500/20 text-red-400"
                        : lastAnalysis?.result.riskLevel === 'MEDIUM'
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    )}>
                      {lastAnalysis ? `${lastAnalysis.result.riskLevel} (${lastAnalysis.result.riskScore}/100)` : 'Not Analyzed'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase font-semibold text-[10px]">Affected Components</span>
                    <span className="font-mono text-foreground">
                      {lastAnalysis ? lastAnalysis.result.affectedServices.length : '0'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {lastAnalysis && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDocModal(false);
                        navigate('/results', { state: lastAnalysis });
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-center"
                    >
                      View Results
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowDocModal(false);
                      navigate('/analyze');
                    }}
                    className="px-4 py-2 glass-panel border border-border text-foreground font-medium text-xs rounded-lg hover:bg-secondary transition-colors cursor-pointer text-center"
                  >
                    Analyze Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDocModal(false);
                      navigate('/upload');
                    }}
                    className={cn(
                      "px-4 py-2 border border-border/80 text-muted-foreground hover:text-foreground font-medium text-xs rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer text-center",
                      !lastAnalysis && "col-span-2"
                    )}
                  >
                    Upload Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. GRID ICON MODAL: Architecture View Fallback */}
      {showArchModal && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowArchModal(false)}
        >
          <div 
            className="w-full max-w-md glass-panel glow-border rounded-2xl border border-border p-6 space-y-6 bg-card/95 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold tracking-tight text-foreground">Architecture Graph</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowArchModal(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-border flex items-center justify-center mx-auto text-muted-foreground">
                <GitBranch className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-foreground">No architecture available.</h4>
                <p className="text-xs text-muted-foreground font-light max-w-xs mx-auto">
                  No custom project topology has been uploaded yet. You can explore the built-in enterprise microservice demo or upload your own codebase.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetToDemo();
                    setShowArchModal(false);
                    navigate('/architecture');
                  }}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  Use Demo Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowArchModal(false);
                    navigate('/upload');
                  }}
                  className="w-full py-2 bg-secondary/80 border border-border text-foreground font-medium text-xs rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                >
                  Upload Project ZIP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SETTINGS ICON MODAL: Real Settings Panel */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowSettingsModal(false)}
        >
          <div 
            className="w-full max-w-lg glass-panel glow-border rounded-2xl border border-border p-6 space-y-6 max-h-[85vh] flex flex-col bg-card/95 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold tracking-tight text-foreground">ChangeGuard Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1 text-xs">
              {/* Analysis Settings */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary font-bold block">
                  Analysis Settings
                </span>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div>
                      <div className="font-semibold text-foreground">Maximum ZIP size</div>
                      <div className="text-muted-foreground text-[11px]">Upper threshold for uploaded project archives</div>
                    </div>
                    <select
                      value={settings.maxZipSizeMB}
                      onChange={(e) => updateSettings({ maxZipSizeMB: Number(e.target.value) })}
                      className="bg-secondary border border-border rounded px-2.5 py-1 text-foreground font-mono"
                    >
                      <option value={20}>20 MB</option>
                      <option value={50}>50 MB</option>
                      <option value={100}>100 MB</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div>
                      <div className="font-semibold text-foreground">Maximum files to analyze</div>
                      <div className="text-muted-foreground text-[11px]">Limits file traversal depth to prevent browser freeze</div>
                    </div>
                    <select
                      value={settings.maxFiles}
                      onChange={(e) => updateSettings({ maxFiles: Number(e.target.value) })}
                      className="bg-secondary border border-border rounded px-2.5 py-1 text-foreground font-mono"
                    >
                      <option value={500}>500 files</option>
                      <option value={1500}>1500 files</option>
                      <option value={2500}>2500 files</option>
                      <option value={5000}>5000 files</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground">Include configuration analysis</div>
                      <div className="text-muted-foreground text-[11px]">Inspect Docker, env, and build manifest configs</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.includeConfigAnalysis}
                      onChange={(e) => updateSettings({ includeConfigAnalysis: e.target.checked })}
                      className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground">Include dependency analysis</div>
                      <div className="text-muted-foreground text-[11px]">Parse package.json, requirements.txt, and pom.xml</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.includeDependencyAnalysis}
                      onChange={(e) => updateSettings({ includeDependencyAnalysis: e.target.checked })}
                      className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground">Include API analysis</div>
                      <div className="text-muted-foreground text-[11px]">Detect OpenAPI specs and REST route patterns</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.includeApiAnalysis}
                      onChange={(e) => updateSettings({ includeApiAnalysis: e.target.checked })}
                      className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                    />
                  </label>

                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-2">
                    <div>
                      <div className="font-semibold text-foreground">Analysis mode</div>
                      <div className="text-muted-foreground text-[11px]">Balances parsing speed vs AST traversal depth</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      {(['Fast', 'Standard', 'Deep'] as const).map((mode) => (
                        <label 
                          key={mode}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors",
                            settings.analysisMode === mode 
                              ? "bg-primary/20 border-primary text-primary font-semibold" 
                              : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <input
                            type="radio"
                            name="analysisMode"
                            value={mode}
                            checked={settings.analysisMode === mode}
                            onChange={() => updateSettings({ analysisMode: mode })}
                            className="hidden"
                          />
                          <span>{mode === 'Fast' ? '○' : mode === 'Standard' ? '◉' : '●'} {mode}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Settings */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary font-bold block">
                  Display Settings
                </span>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground">Animation effects</div>
                      <div className="text-muted-foreground text-[11px]">Graph edge flow and ripple animations</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.animationEffects}
                      onChange={(e) => updateSettings({ animationEffects: e.target.checked })}
                      className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground">Cursor glow</div>
                      <div className="text-muted-foreground text-[11px]">Ambient purple cursor-following light</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.cursorGlow}
                      onChange={(e) => updateSettings({ cursorGlow: e.target.checked })}
                      className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/40 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground">Reduced motion</div>
                      <div className="text-muted-foreground text-[11px]">Disable high-frequency layout animations</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.reducedMotion}
                      onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
                      className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <button
                type="button"
                onClick={() => updateSettings({
                  maxZipSizeMB: 50,
                  maxFiles: 2500,
                  includeConfigAnalysis: true,
                  includeDependencyAnalysis: true,
                  includeApiAnalysis: true,
                  analysisMode: 'Standard',
                  animationEffects: true,
                  cursorGlow: true,
                  reducedMotion: false,
                })}
                className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                Reset to Defaults
              </button>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
