import { ServiceNode, DependencyEdge } from '../data/mockData';

export interface PositionedNode extends ServiceNode {
  position: { x: number; y: number };
}

export interface PartitionGroup {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArchitectureLayoutResult {
  positionedNodes: PositionedNode[];
  partitions: PartitionGroup[];
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 58;
const GAP_X = 40;
const LAYER_Y = [0, 45, 175, 315, 465, 615, 765]; // Layer 1 to 6

const GROUP_TITLES: Record<number, string> = {
  1: 'FRONTEND',
  2: 'API / GATEWAY',
  3: 'CORE SERVICES',
  4: 'WORKERS / EVENTS',
  5: 'DATA',
  6: 'EXTERNAL / INFRA'
};

export function computeArchitectureLayout(
  nodes: ServiceNode[],
  edges: DependencyEdge[]
): ArchitectureLayoutResult {
  // 1. Group nodes by layer (1 to 6)
  const layers: Record<number, ServiceNode[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  nodes.forEach(node => {
    let layer = node.layer;
    if (!layer || layer < 1 || layer > 6) {
      // Infer layer if not set
      if (node.type === 'application') layer = 1;
      else if (node.type === 'gateway') layer = 2;
      else if (node.type === 'worker' || node.type === 'event') layer = 4;
      else if (node.type === 'database') layer = 5;
      else if (node.type === 'external' || node.type === 'infrastructure') layer = 6;
      else layer = 3;
    }
    layers[layer].push(node);
  });

  // Sort nodes in Layer 3 (Core Services) so upstream callers appear before downstream dependencies
  if (layers[3].length > 1) {
    const inDegree: Record<string, number> = {};
    const outDegree: Record<string, number> = {};
    layers[3].forEach(n => {
      inDegree[n.id] = 0;
      outDegree[n.id] = 0;
    });

    edges.forEach(e => {
      if (inDegree[e.target] !== undefined) inDegree[e.target]++;
      if (outDegree[e.source] !== undefined) outDegree[e.source]++;
    });

    layers[3].sort((a, b) => {
      // Primary: higher out-degree first (upstream calls downstream)
      const diffOut = (outDegree[b.id] || 0) - (outDegree[a.id] || 0);
      if (diffOut !== 0) return diffOut;
      // Secondary: lower in-degree first
      return (inDegree[a.id] || 0) - (inDegree[b.id] || 0);
    });
  }

  // Calculate maximum layer width to center all layers
  let maxWidth = 800;
  for (let l = 1; l <= 6; l++) {
    const count = layers[l].length;
    if (count > 0) {
      const w = count * NODE_WIDTH + (count - 1) * GAP_X;
      if (w > maxWidth) maxWidth = w;
    }
  }

  const positionedNodes: PositionedNode[] = [];
  const partitions: PartitionGroup[] = [];

  for (let l = 1; l <= 6; l++) {
    const layerNodes = layers[l];
    const count = layerNodes.length;
    if (count === 0) continue;

    const layerWidth = count * NODE_WIDTH + (count - 1) * GAP_X;
    const startX = Math.max(40, (maxWidth - layerWidth) / 2);
    const y = LAYER_Y[l];

    // Partition container dimensions
    partitions.push({
      id: `group-partition-${l}`,
      label: GROUP_TITLES[l] || `LAYER ${l}`,
      x: startX - 25,
      y: y - 28,
      width: layerWidth + 50,
      height: NODE_HEIGHT + 48
    });

    layerNodes.forEach((node, idx) => {
      const x = startX + idx * (NODE_WIDTH + GAP_X);
      positionedNodes.push({
        ...node,
        position: { x, y }
      });
    });
  }

  return { positionedNodes, partitions };
}
