import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileArchive, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Cpu, Layers, GitBranch, Database, ShieldCheck, FileCode } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { parseProjectZip, ZipParseProgress } from '../utils/zipAnalyzer';
import DependencyGraph from '../components/DependencyGraph';
import { cn } from '../utils/cn';

export default function UploadProject() {
  const navigate = useNavigate();
  const { currentProject, uploadedFile, settings, setProject, resetToDemo } = useProject();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ZipParseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFile = async (file: File) => {
    // Validate file extension and MIME type
    const isZip = 
      file.name.toLowerCase().endsWith('.zip') || 
      file.type === 'application/zip' || 
      file.type === 'application/x-zip-compressed';

    if (!isZip) {
      setError('Please upload a valid .zip project archive.');
      return;
    }

    const maxSizeBytes = (settings.maxZipSizeMB || 50) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`ZIP archive exceeds the safety limit of ${settings.maxZipSizeMB || 50}MB.`);
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress({ step: 'Detecting file archive...', percent: 5 });

    try {
      const analyzed = await parseProjectZip(file, (p) => setProgress(p), {
        maxFiles: settings.maxFiles,
        analysisMode: settings.analysisMode,
        includeConfigAnalysis: settings.includeConfigAnalysis,
        includeDependencyAnalysis: settings.includeDependencyAnalysis,
        includeApiAnalysis: settings.includeApiAnalysis,
      });

      setProject(analyzed, { name: file.name, size: file.size });
      setIsProcessing(false);
      setProgress(null);
    } catch (err: any) {
      setError(err?.message || 'Unable to analyze this ZIP. The archive may be corrupted or unsupported.');
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleCancel = () => {
    setIsProcessing(false);
    setProgress(null);
    setError(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Analyze Your Project</h1>
        <p className="text-lg text-muted-foreground font-light">
          Upload a project ZIP to automatically map its service architecture, API routes, and dependencies for pre-deployment impact analysis.
        </p>
      </div>

      {/* Main Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload Box */}
        <div className="lg:col-span-6 space-y-6">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "glow-border rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[340px] relative overflow-hidden group bg-card/60 backdrop-blur-md border border-border",
              isDragging ? "border-primary bg-primary/10 scale-[1.01]" : "hover:border-primary/50 hover:bg-card/90"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                  e.target.value = ''; // Reset input to allow selecting same file again
                }
              }}
            />

            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-105 transition-all text-primary shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Upload className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">
              {uploadedFile ? 'Replace Project Archive' : 'Drop your project archive here'}
            </h3>
            <p className="text-sm text-muted-foreground font-light mb-6 max-w-xs">
              Drag & drop a <span className="font-mono text-primary font-medium">.zip</span> codebase or browse files on your computer
            </p>

            {uploadedFile ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-xs text-primary font-mono">
                <FileArchive className="w-4 h-4" />
                <span className="font-semibold">{uploadedFile.name}</span>
                <span className="text-muted-foreground">({formatFileSize(uploadedFile.size)})</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/60 border border-border text-xs text-muted-foreground font-mono">
                <FileArchive className="w-3.5 h-3.5" />
                <span>Supported: ZIP (.zip) up to {settings.maxZipSizeMB || 50}MB</span>
              </div>
            )}

            {/* In-flight extraction progress */}
            {isProcessing && progress && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-8 space-y-4 z-20" onClick={(e) => e.stopPropagation()}>
                <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                <div className="space-y-1 text-center">
                  <div className="text-sm font-bold text-foreground">{progress.step}</div>
                  <div className="text-xs font-mono text-muted-foreground">{progress.percent}% complete</div>
                </div>
                <div className="w-48 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-xs text-muted-foreground hover:text-foreground underline pt-2 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Active File Actions & Controls */}
          {uploadedFile && (
            <div className="flex items-center justify-between p-4 rounded-xl glass-panel border border-border">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div className="text-xs">
                  <span className="font-mono text-foreground font-semibold">{uploadedFile.name}</span>
                  <span className="text-muted-foreground ml-2">({formatFileSize(uploadedFile.size)})</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-medium text-foreground transition-colors cursor-pointer"
                >
                  Replace ZIP
                </button>
                <button
                  type="button"
                  onClick={resetToDemo}
                  className="px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-xs font-medium text-destructive transition-colors cursor-pointer"
                >
                  Reset Project
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Fallback / Demo Option */}
          <div className="flex items-center justify-between p-5 rounded-xl glass-panel border border-border">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-foreground">Sample Projects & Verification</div>
                <div className="text-xs text-muted-foreground font-light">Load verified test packages or reset to demo</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsProcessing(true);
                    setProgress({ step: 'Loading ShopSphere (ecommerce architecture)...', percent: 15 });
                    const res = await fetch('/shopsphere-detailed.zip');
                    if (!res.ok) throw new Error('File not found');
                    const blob = await res.blob();
                    const file = new File([blob], 'shopsphere-detailed.zip', { type: 'application/zip' });
                    await handleFile(file);
                  } catch (err: any) {
                    setError('Unable to analyze this ZIP. The archive may be corrupted or unsupported.');
                    setIsProcessing(false);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-xs font-mono text-primary transition-colors cursor-pointer"
              >
                ShopSphere ZIP
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsProcessing(true);
                    setProgress({ step: 'Loading FinCore (banking architecture)...', percent: 15 });
                    const res = await fetch('/fincore-detailed.zip');
                    if (!res.ok) throw new Error('File not found');
                    const blob = await res.blob();
                    const file = new File([blob], 'fincore-detailed.zip', { type: 'application/zip' });
                    await handleFile(file);
                  } catch (err: any) {
                    setError('Unable to analyze this ZIP. The archive may be corrupted or unsupported.');
                    setIsProcessing(false);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-xs font-mono text-primary transition-colors cursor-pointer"
              >
                FinCore ZIP
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsProcessing(true);
                    setProgress({ step: 'Loading FleetFlow (logistics architecture)...', percent: 15 });
                    const res = await fetch('/fleetflow-detailed.zip');
                    if (!res.ok) throw new Error('File not found');
                    const blob = await res.blob();
                    const file = new File([blob], 'fleetflow-detailed.zip', { type: 'application/zip' });
                    await handleFile(file);
                  } catch (err: any) {
                    setError('Unable to analyze this ZIP. The archive may be corrupted or unsupported.');
                    setIsProcessing(false);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-xs font-mono text-primary transition-colors cursor-pointer"
              >
                FleetFlow ZIP
              </button>
              <button
                type="button"
                onClick={resetToDemo}
                className="px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary border border-border text-xs font-medium text-foreground transition-colors cursor-pointer"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>

        {/* Project Summary & Inspector */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel p-8 rounded-2xl border border-border space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary font-bold block mb-1">
                  {currentProject.isCustom ? 'Active Custom Project' : 'Simulated Reference Project'}
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{currentProject.name}</h2>
              </div>
              <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-medium">
                {currentProject.uploadedAt}
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40">
                <span className="text-2xl font-bold font-mono text-foreground">{currentProject.stats.filesAnalyzed}</span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mt-1">Files Analyzed</span>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40">
                <span className="text-2xl font-bold font-mono text-primary">{currentProject.stats.modulesDetected}</span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mt-1">Modules Detected</span>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40">
                <span className="text-2xl font-bold font-mono text-foreground">{currentProject.stats.dependenciesCount}</span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mt-1">Dependencies</span>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40">
                <span className="text-2xl font-bold font-mono text-foreground">{currentProject.stats.apisDetected}</span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mt-1">APIs Detected</span>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40">
                <span className="text-2xl font-bold font-mono text-foreground">{currentProject.stats.databaseReferences}</span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mt-1">DB References</span>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40">
                <span className="text-2xl font-bold font-mono text-foreground">{currentProject.stats.externalServices}</span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mt-1">External APIs</span>
              </div>
            </div>

            {/* Technology Stack Detected */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground block">
                Detected Project Stack
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider block font-bold">Languages</span>
                  <div className="font-mono text-foreground">{currentProject.technology.languages.join(', ') || 'None'}</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider block font-bold">Frameworks</span>
                  <div className="font-mono text-foreground">{currentProject.technology.frameworks.join(', ') || 'None'}</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider block font-bold">Build Systems</span>
                  <div className="font-mono text-foreground">{currentProject.technology.buildSystem.join(', ') || 'Standard'}</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider block font-bold">Databases</span>
                  <div className="font-mono text-foreground">{currentProject.technology.databases.join(', ') || 'None'}</div>
                </div>
              </div>
            </div>

            {/* Analysis Confidence Section */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary tracking-wider uppercase text-[10px]">Analysis Confidence</span>
                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono text-[10px] font-bold">
                  {currentProject.confidence.level}
                </span>
              </div>
              <ul className="text-muted-foreground space-y-1 text-[11px] list-disc list-inside">
                {currentProject.confidence.detectedFrom.map((src, i) => (
                  <li key={i}>{src}</li>
                ))}
              </ul>
            </div>

            {/* Action CTA to Analyze Changes */}
            <div className="pt-2">
              <button
                onClick={() => navigate('/analyze')}
                className="w-full glow-border py-4 px-6 bg-primary text-primary-foreground rounded-md font-semibold tracking-wide hover:bg-primary/90 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                <span>Proceed to Change Impact Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Preview for Uploaded Project */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Extracted Architecture Graph</h2>
            <p className="text-sm text-muted-foreground font-light">
              Interactive topology reconstructed from {currentProject.name} components.
            </p>
          </div>
          <button
            onClick={() => navigate('/architecture')}
            className="text-xs text-primary hover:underline font-mono"
          >
            Open in Full Inspector →
          </button>
        </div>

        <div className="h-[420px] rounded-xl overflow-hidden glass-panel border border-border">
          <DependencyGraph
            nodes={currentProject.nodes}
            edges={currentProject.edges}
            interactive={true}
            animatedEdges={true}
          />
        </div>
      </div>
    </div>
  );
}
