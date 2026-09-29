import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Activity, GitCommit, Server, ShieldCheck } from 'lucide-react';
import DependencyGraph from '../components/DependencyGraph';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-10">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          {/* Official Shield Logo Brand Mark */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/25 blur-xl pointer-events-none opacity-50" />
              <img
                src="/changeguard-logo.png"
                alt="ChangeGuard"
                className="w-20 h-20 md:w-24 md:h-24 object-contain relative z-10 drop-shadow-[0_0_16px_rgba(168,85,247,0.4)] transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>
            <span className="text-xs md:text-sm font-bold tracking-[0.25em] text-primary uppercase font-mono">
              ChangeGuard
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight text-glow">
            KNOW THE <br />
            <span className="text-primary">BLAST RADIUS</span> <br />
            BEFORE YOU DEPLOY.
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto">
            Pre-deployment impact intelligence for distributed systems.
          </p>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analyze configuration, API and infrastructure changes against your service dependency graph before they reach production.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={() => navigate('/upload')}
              className="glow-border group relative px-8 py-4 bg-primary text-primary-foreground rounded-md font-semibold tracking-wide hover:bg-primary/90 transition-all flex items-center gap-3 overflow-hidden cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative z-10">Upload & Analyze Project</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => navigate('/analyze')}
              className="px-6 py-4 glass-panel text-foreground rounded-md font-semibold tracking-wide hover:bg-secondary transition-all cursor-pointer"
            >
              Simulate a Change
            </button>
            
            <button 
              onClick={() => navigate('/architecture')}
              className="px-6 py-4 text-muted-foreground hover:text-foreground rounded-md font-semibold tracking-wide transition-all cursor-pointer"
            >
              View Architecture
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto w-full">
        <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
          <Server className="w-8 h-8 text-primary mb-2 opacity-80" />
          <h3 className="text-4xl font-bold font-mono">12</h3>
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Services</p>
        </div>
        <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
          <GitCommit className="w-8 h-8 text-primary mb-2 opacity-80" />
          <h3 className="text-4xl font-bold font-mono">34</h3>
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Dependencies</p>
        </div>
        <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
          <Activity className="w-8 h-8 text-primary mb-2 opacity-80" />
          <h3 className="text-4xl font-bold font-mono">7</h3>
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Recent Changes</p>
        </div>
        <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center gap-2 text-center glow-border">
          <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
          <h3 className="text-4xl font-bold font-mono text-emerald-400">99.99%</h3>
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Availability</p>
        </div>
      </section>

      {/* Graph Demo Section */}
      <section className="max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            ONE SMALL CHANGE.<br />
            <span className="text-primary text-glow">A SYSTEM-WIDE RIPPLE.</span>
          </h2>
        </div>
        
        <div className="h-[600px] relative rounded-2xl overflow-hidden glow-border p-1">
          <DependencyGraph interactive={false} animatedEdges={true} />
        </div>
      </section>
    </div>
  );
}
