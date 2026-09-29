import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Node, Edge, Position, MarkerType, Handle } from '@xyflow/react';
import { mockNodes, mockEdges, ServiceNode, DependencyEdge } from '../data/mockData';
import { Server, Database, Cloud, Laptop, Network, Workflow, Radio, Layers } from 'lucide-react';
import { cn } from '../utils/cn';
import { computeArchitectureLayout } from '../utils/graphLayout';

interface CustomNodeProps {
  data: {
    label: string;
    type: string;
    criticality: 'low' | 'medium' | 'high' | 'critical';
    highlighted?: boolean;
    faded?: boolean;
    isSource?: boolean;
    group?: string;
  }
}

const CustomNode = ({ data }: CustomNodeProps) => {
  const isHighlighted = data.highlighted;
  const isFaded = data.faded;
  const isSource = data.isSource;
  const type = data.type;

  const renderIcon = () => {
    switch (type) {
      case 'application':
        return <Laptop className="w-4 h-4 text-violet-300" />;
      case 'gateway':
        return <Network className="w-4 h-4 text-purple-400" />;
      case 'worker':
        return <Workflow className="w-4 h-4 text-amber-400" />;
      case 'event':
        return <Radio className="w-4 h-4 text-pink-400" />;
      case 'database':
        return <Database className="w-4 h-4 text-blue-400" />;
      case 'external':
        return <Cloud className="w-4 h-4 text-emerald-400" />;
      case 'infrastructure':
        return <Layers className="w-4 h-4 text-zinc-400" />;
      default:
        return <Server className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className={cn(
      "w-[220px] px-3.5 py-2.5 rounded-xl border backdrop-blur-md flex items-center gap-3 transition-all duration-300 relative group cursor-pointer",
      isSource ? "bg-red-500/20 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.35)] ring-1 ring-red-500/50" :
      isHighlighted ? "bg-primary/25 border-primary/60 shadow-[0_0_20px_rgba(168,85,247,0.35)] ring-1 ring-primary/50" : 
      isFaded ? "bg-card/20 border-border/20 opacity-30 grayscale" :
      "bg-card/85 border-border/80 hover:border-primary/50 hover:bg-card/95 shadow-lg",
      type === 'database' && !isHighlighted && !isSource ? "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60" : "",
      type === 'external' && !isHighlighted && !isSource ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60" : "",
      type === 'gateway' && !isHighlighted && !isSource ? "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60" : "",
      type === 'application' && !isHighlighted && !isSource ? "border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60" : ""
    )}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-primary/60 !border-0" />
      
      <div className={cn(
        "p-2 rounded-lg bg-background/60 border border-white/5 shrink-0 transition-transform group-hover:scale-105",
        isSource ? "text-red-400" :
        isHighlighted ? "text-primary" : "text-muted-foreground"
      )}>
        {renderIcon()}
      </div>
      
      <div className="flex flex-col min-w-0 flex-1">
        <span className={cn(
          "text-xs font-semibold truncate",
          isSource ? "text-red-100" :
          isHighlighted ? "text-primary-foreground font-bold" : "text-foreground"
        )}>
          {data.label}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground/80 font-medium">
            {data.type}
          </span>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full inline-block shrink-0",
            data.criticality === 'critical' ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]" :
            data.criticality === 'high' ? "bg-orange-400" :
            data.criticality === 'medium' ? "bg-yellow-400" : "bg-emerald-400"
          )} />
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-primary/60 !border-0" />
    </div>
  );
};

const PartitionGroupNode = ({ data }: { data: { label: string; width: number; height: number } }) => {
  return (
    <div 
      style={{ width: data.width, height: data.height }}
      className="rounded-2xl border border-primary/20 bg-primary/[0.02] backdrop-blur-[1px] p-2.5 pointer-events-none select-none relative transition-all"
    >
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-[10px] font-mono uppercase tracking-[0.2em] text-primary font-bold shadow-sm">
        <span>{data.label}</span>
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
  partitionGroup: PartitionGroupNode,
};

interface DependencyGraphProps {
  nodes?: ServiceNode[];
  edges?: DependencyEdge[];
  sourceNodeId?: string;
  highlightedNodeIds?: string[];
  selectedEdgeId?: string;
  interactive?: boolean;
  animatedEdges?: boolean;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

export default function DependencyGraph({ 
  nodes: customNodes,
  edges: customEdges,
  sourceNodeId, 
  highlightedNodeIds = [], 
  selectedEdgeId,
  interactive = true,
  animatedEdges = false,
  onNodeClick,
  onEdgeClick
}: DependencyGraphProps) {
  const activeNodes = customNodes || mockNodes;
  const activeEdges = customEdges || mockEdges;

  // Compute hierarchical architecture layout and partition groups
  const layout = useMemo(() => {
    return computeArchitectureLayout(activeNodes, activeEdges);
  }, [activeNodes, activeEdges]);

  const nodes: Node[] = useMemo(() => {
    // 1. Add Partition Group background nodes
    const partitionNodes: Node[] = layout.partitions.map(p => ({
      id: p.id,
      type: 'partitionGroup',
      position: { x: p.x, y: p.y },
      data: {
        label: p.label,
        width: p.width,
        height: p.height
      },
      selectable: false,
      draggable: false,
      zIndex: -1
    }));

    // 2. Add Component nodes
    const componentNodes: Node[] = layout.positionedNodes.map(node => {
      const isSource = node.id === sourceNodeId;
      const isHighlighted = highlightedNodeIds.includes(node.id);
      const isFaded = sourceNodeId ? (!isSource && !isHighlighted) : false;

      return {
        id: node.id,
        type: 'custom',
        position: node.position,
        data: {
          label: node.label,
          type: node.type,
          criticality: node.criticality,
          highlighted: isHighlighted,
          faded: isFaded,
          isSource,
          group: node.group
        },
        zIndex: 10
      };
    });

    return [...partitionNodes, ...componentNodes];
  }, [layout, sourceNodeId, highlightedNodeIds]);

  const edges: Edge[] = useMemo(() => {
    return activeEdges.map(edge => {
      const isConnected = highlightedNodeIds.includes(edge.target) || 
                          highlightedNodeIds.includes(edge.source) || 
                          sourceNodeId === edge.target || 
                          sourceNodeId === edge.source;
      const isSelected = selectedEdgeId === edge.id;
      const isHighlighted = isConnected || isSelected;
      const isFaded = sourceNodeId ? !isHighlighted : false;

      const semanticLabel = edge.semanticType || (edge.type !== 'sync' && edge.type !== 'async' ? edge.type : undefined);

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: animatedEdges || isHighlighted,
        label: semanticLabel,
        labelStyle: { 
          fill: isSelected ? 'rgb(244, 114, 182)' : isHighlighted ? 'rgb(216, 180, 254)' : 'rgba(216, 180, 254, 0.75)', 
          fontSize: 8, 
          fontFamily: 'monospace', 
          fontWeight: 600,
          letterSpacing: '0.05em'
        },
        labelBgStyle: { 
          fill: 'rgba(16, 12, 28, 0.92)', 
          fillOpacity: 0.95,
          stroke: isSelected ? 'rgba(244, 114, 182, 0.8)' : isHighlighted ? 'rgba(168, 85, 247, 0.6)' : 'rgba(168, 85, 247, 0.25)', 
          strokeWidth: 1 
        },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
        style: {
          stroke: isSelected ? 'rgb(244, 114, 182)' :
                 isFaded ? 'rgba(255,255,255,0.08)' : 
                 (isHighlighted ? 'rgba(168,85,247,0.9)' : 'rgba(255,255,255,0.22)'),
          strokeWidth: isSelected ? 2.5 : isHighlighted ? 2 : 1.2,
          transition: 'all 0.3s ease',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSelected ? 'rgb(244, 114, 182)' :
                 isFaded ? 'rgba(255,255,255,0.08)' : 
                 (isHighlighted ? 'rgba(168,85,247,0.9)' : 'rgba(255,255,255,0.25)'),
        }
      };
    });
  }, [activeEdges, sourceNodeId, highlightedNodeIds, selectedEdgeId, animatedEdges]);

  return (
    <div className="w-full h-full min-h-[450px] rounded-xl overflow-hidden glass-panel relative">
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          if (node.type !== 'partitionGroup') {
            onNodeClick?.(node.id);
          }
        }}
        onEdgeClick={(_, edge) => {
          onEdgeClick?.(edge.id);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        panOnDrag={interactive}
        zoomOnScroll={interactive}
        nodesDraggable={interactive}
        elementsSelectable={interactive}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(168, 85, 247, 0.08)" gap={24} size={1} />
        {interactive && <Controls className="bg-card/90 border-border fill-foreground" />}
      </ReactFlow>
    </div>
  );
}
