import React from 'react';
import { useNavigate } from 'react-router-dom';
import { mockIncidents, mockNodes } from '../data/mockData';
import { AlertOctagon, Calendar, Server, ChevronRight, ShieldAlert } from 'lucide-react';
import { cn } from '../utils/cn';

export default function Incidents() {
  const navigate = useNavigate();
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Incident History</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Historical incident records are used by the risk engine to identify patterns and predict future blast radiuses based on past failures.
          </p>
        </div>
        
        <div className="glass-panel px-4 py-2 rounded-lg border border-border flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-medium tracking-wide">AI SYNCED</span>
        </div>
      </div>

      <div className="space-y-4">
        {mockIncidents.map(incident => {
          const isCritical = incident.severity === 'critical';
          const isHigh = incident.severity === 'high';
          
          return (
            <div key={incident.id} className="glass-panel rounded-xl overflow-hidden border border-border group hover:border-primary/30 transition-all">
              <div className="p-6 flex items-start gap-6">
                <div className="shrink-0 mt-1">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isCritical ? "bg-red-500/20 text-red-500" :
                    isHigh ? "bg-orange-500/20 text-orange-500" :
                    "bg-yellow-500/20 text-yellow-500"
                  )}>
                    {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-xs font-bold text-muted-foreground">{incident.id}</span>
                        <span className={cn(
                          "text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded",
                          isCritical ? "bg-red-500/10 text-red-500" :
                          isHigh ? "bg-orange-500/10 text-orange-500" :
                          "bg-yellow-500/10 text-yellow-500"
                        )}>
                          {incident.severity}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{incident.title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {incident.date}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1 block">Root Cause</label>
                      <p className="text-sm text-foreground/80">{incident.rootCause}</p>
                    </div>
                    
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 block">Impacted Services</label>
                      <div className="flex flex-wrap gap-2">
                        {incident.impactedServices.map(serviceId => {
                          const node = mockNodes.find(n => n.id === serviceId);
                          return (
                            <span key={serviceId} className="px-2 py-1 bg-secondary rounded text-xs font-mono flex items-center gap-1.5 border border-border">
                              <Server className="w-3 h-3 text-muted-foreground" />
                              {node?.label || serviceId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="shrink-0 flex items-center h-full opacity-60 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => navigate('/analyze')}
                    title="Simulate this failure scenario"
                    className="p-2 rounded-full hover:bg-secondary cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
