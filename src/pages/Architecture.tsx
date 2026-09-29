import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import DependencyGraph from '../components/DependencyGraph';
import { 
  Server, 
  Database, 
  Cloud, 
  ShieldAlert, 
  GitCommit, 
  Search, 
  Code2, 
  Laptop, 
  Network, 
  Workflow, 
  Radio, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  FileCode,
  Info
} from 'lucide-react';
import { cn } from '../utils/cn';

export default function Architecture() {
  const { currentProject } = useProject();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const activeNodes = currentProject.nodes;
  const activeEdges = currentProject.edges;

  const filteredNodes = activeNodes.filter(n => 
    n.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedNode = activeNodes.find(n => n.id === selectedNodeId);
  const selectedEdge = activeEdges.find(e => e.id === selectedEdgeId);

  const dependencies = selectedNodeId ? activeEdges.filter(e => e.source === selectedNodeId).map(e => e.target) : [];
  const dependents = selectedNodeId ? activeEdges.filter(e => e.target === selectedNodeId).map(e => e.source) : [];

  // Debug statistics
  const servicesCount = activeNodes.filter(n => n.type === 'service' || n.type === 'gateway').length;
  const databasesCount = activeNodes.filter(n => n.type === 'database').length;
  const externalCount = activeNodes.filter(n => n.type === 'external' || n.type === 'infrastructure').length;
  const workersCount = activeNodes.filter(n => n.type === 'worker' || n.type === 'event').length;

  const getNodeLabel = (id: string) => {
    return activeNodes.find(n => n.id === id)?.label || id;
  };

  const renderNodeIcon = (type: string) => {
    switch (type) {
      case 'application': return <Laptop className="w-5 h-5 text-violet-300" />;
      case 'gateway': return <Network className="w-5 h-5 text-purple-400" />;
      case 'worker': return <Workflow className="w-5 h-5 text-amber-400" />;
      case 'event': return <Radio className="w-5 h-5 text-pink-400" />;
      case 'database': return <Database className="w-5 h-5 text-blue-400" />;
      case 'external': return <Cloud className="w-5 h-5 text-emerald-400" />;
      case 'infrastructure': return <Layers className="w-5 h-5 text-zinc-400" />;
      default: return <Server className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">System Architecture</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-mono font-medium">
              {currentProject.name}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Interactive multi-branch dependency graph extracted directly from project source files.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className={cn(
              "px-3 py-2 border rounded-md text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer",
              showDebugPanel ? "bg-primary/20 border-primary text-primary" : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Parser Debug</span>
            {showDebugPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search components..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary w-60 text-foreground font-mono"
            />
          </div>
          {(selectedNodeId || selectedEdgeId) && (
            <button
              onClick={() => {
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
              }}
              className="px-3 py-2 bg-secondary/70 hover:bg-secondary border border-border rounded-md text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Reset Focus
            </button>
          )}
        </div>
      </div>

      {/* Expandable Debug Information Panel (Requirement 16) */}
      {showDebugPanel && (
        <div className="p-4 rounded-xl glass-panel border border-primary/30 bg-card/90 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-foreground">
                Project Structure & Extraction Summary
              </span>
            </div>
            <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/25">
              Confidence: {currentProject.confidence.level}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[10px] uppercase block">Files Scanned</span>
              <span className="text-base font-bold text-foreground">{currentProject.stats.filesAnalyzed}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[10px] uppercase block">Services Detected</span>
              <span className="text-base font-bold text-primary">{servicesCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[10px] uppercase block">Databases Detected</span>
              <span className="text-base font-bold text-blue-400">{databasesCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[10px] uppercase block">Workers & Events</span>
              <span className="text-base font-bold text-amber-400">{workersCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[10px] uppercase block">Dependencies Extracted</span>
              <span className="text-base font-bold text-emerald-400">{activeEdges.length}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
              Top Detected Relationships
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto font-mono text-xs pr-1">
              {activeEdges.slice(0, 8).map(e => (
                <div 
                  key={e.id}
                  onClick={() => {
                    setSelectedEdgeId(e.id);
                    setSelectedNodeId(null);
                  }}
                  className="p-2 rounded bg-secondary/30 border border-border/50 hover:border-primary/50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-foreground font-medium">{getNodeLabel(e.source)}</span>
                    <span className="text-primary text-[10px] font-bold">→</span>
                    <span className="text-foreground font-medium">{getNodeLabel(e.target)}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase font-bold shrink-0">
                    {e.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        <div className="lg:col-span-3 glow-border rounded-xl p-1 relative overflow-hidden bg-card/40">
          <DependencyGraph 
            nodes={filteredNodes}
            edges={activeEdges}
            sourceNodeId={selectedNodeId || undefined}
            highlightedNodeIds={selectedNodeId ? [...dependencies, ...dependents] : []}
            selectedEdgeId={selectedEdgeId || undefined}
            onNodeClick={(id) => {
              setSelectedNodeId(id);
              setSelectedEdgeId(null);
            }}
            onEdgeClick={(id) => {
              setSelectedEdgeId(id);
              setSelectedNodeId(null);
            }}
            interactive={true} 
            animatedEdges={true} 
          />
          
          {/* Architecture Legend */}
          <div className="absolute bottom-4 left-4 glass-panel p-3.5 rounded-xl flex flex-col gap-2 text-xs z-10 border border-border/60 shadow-xl max-w-xs">
            <div className="font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">
              Architecture Layers & Types
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-violet-300" />
                <span>Application</span>
              </div>
              <div className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-purple-400" />
                <span>API Gateway</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-primary" />
                <span>Core Service</span>
              </div>
              <div className="flex items-center gap-2">
                <Workflow className="w-3.5 h-3.5 text-amber-400" />
                <span>Worker / Event</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Database</span>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>External / Infra</span>
              </div>
            </div>
            <div className="border-t border-border/40 pt-2 text-[10px] text-muted-foreground font-mono">
              Click node or edge for deep evidence
            </div>
          </div>
        </div>

        {/* Component & Edge Inspector */}
        <div className="glass-panel rounded-xl border border-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
            <h3 className="font-semibold tracking-wide text-sm">
              {selectedEdge ? 'Relationship Inspector' : 'Component Inspector'}
            </h3>
            {selectedNode && (
              <span className="text-[10px] font-mono text-primary font-bold uppercase px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                {selectedNode.type}
              </span>
            )}
            {selectedEdge && (
              <span className="text-[10px] font-mono text-pink-400 font-bold uppercase px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/20">
                {selectedEdge.type}
              </span>
            )}
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {/* 1. Edge Selected: Show Explainable Relationship Evidence (Requirement 11) */}
            {selectedEdge ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground font-semibold">
                    Detected Relationship
                  </span>
                  <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-secondary/40 border border-border">
                    <span className="text-sm font-bold text-foreground font-mono">{getNodeLabel(selectedEdge.source)}</span>
                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-bold text-foreground font-mono">{getNodeLabel(selectedEdge.target)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Relationship Type</span>
                    <span className="text-primary font-bold text-sm mt-0.5 block">{selectedEdge.type}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Detection Confidence</span>
                    <span className="text-emerald-400 font-bold text-sm mt-0.5 block">{selectedEdge.confidence || 'HIGH'}</span>
                  </div>
                </div>

                {selectedEdge.evidence?.file && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-primary" /> Source File
                    </label>
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border font-mono text-xs text-foreground break-all">
                      {selectedEdge.evidence.file}
                    </div>
                  </div>
                )}

                {selectedEdge.evidence?.snippet && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-primary" /> Matched Code Evidence
                    </label>
                    <pre className="p-3 rounded-lg bg-background/80 border border-border font-mono text-xs text-primary/90 overflow-x-auto whitespace-pre-wrap">
                      {selectedEdge.evidence.snippet}
                    </pre>
                  </div>
                )}

                {selectedEdge.evidence?.reason && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-primary" /> Rationale
                    </label>
                    <p className="text-sm text-foreground/90 font-light leading-relaxed p-3 rounded-lg bg-secondary/20 border border-border/50">
                      {selectedEdge.evidence.reason}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-border/50 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedNodeId(selectedEdge.source);
                      setSelectedEdgeId(null);
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-mono text-foreground cursor-pointer transition-colors"
                  >
                    View Source: {getNodeLabel(selectedEdge.source)}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedNodeId(selectedEdge.target);
                      setSelectedEdgeId(null);
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-mono text-foreground cursor-pointer transition-colors"
                  >
                    View Target: {getNodeLabel(selectedEdge.target)}
                  </button>
                </div>
              </div>
            ) : selectedNode ? (
              /* 2. Node Selected */
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center shrink-0">
                    {renderNodeIcon(selectedNode.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedNode.label}</h2>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{selectedNode.id}</p>
                    {selectedNode.group && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-primary/80 block mt-1">
                        Group: {selectedNode.group}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Description</label>
                    <p className="text-sm mt-1 text-foreground/90 font-light leading-relaxed">{selectedNode.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Owner / Maintainer</label>
                      <p className="text-sm font-medium mt-1">{selectedNode.owner}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Criticality</label>
                      <p className="text-sm font-medium mt-1 capitalize flex items-center gap-1.5">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          selectedNode.criticality === 'critical' ? "bg-red-500" :
                          selectedNode.criticality === 'high' ? "bg-orange-500" :
                          selectedNode.criticality === 'medium' ? "bg-yellow-500" : "bg-emerald-500"
                        )} />
                        {selectedNode.criticality}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 block flex items-center gap-1.5">
                      <GitCommit className="w-3 h-3 text-primary" /> Calls / Downstream Dependencies ({dependencies.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {dependencies.length > 0 ? dependencies.map(id => (
                        <button
                          key={id}
                          onClick={() => setSelectedNodeId(id)}
                          className="px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-xs font-mono text-left cursor-pointer transition-colors border border-border"
                        >
                          {getNodeLabel(id)}
                        </button>
                      )) : <span className="text-xs text-muted-foreground">None</span>}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 block flex items-center gap-1.5">
                      <ShieldAlert className="w-3 h-3 text-red-400" /> Called By / Upstream Callers ({dependents.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {dependents.length > 0 ? dependents.map(id => (
                        <button 
                          key={id}
                          onClick={() => setSelectedNodeId(id)}
                          className="px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-xs font-mono text-left cursor-pointer transition-colors border border-border"
                        >
                          {getNodeLabel(id)}
                        </button>
                      )) : <span className="text-xs text-muted-foreground">None</span>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 3. Empty State */
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                <Server className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm font-light">
                  Select any component node or connecting edge to inspect dependency evidence and architecture metadata.
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-[240px] pt-2">
                  {activeNodes.slice(0, 4).map(node => (
                    <button 
                      key={node.id} 
                      onClick={() => setSelectedNodeId(node.id)} 
                      className="text-xs text-primary hover:underline font-mono cursor-pointer"
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
