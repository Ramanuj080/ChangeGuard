import { mockNodes, mockEdges, mockIncidents, ServiceNode, DependencyEdge } from '../data/mockData';

export interface AnalysisRequest {
  changeType: string;
  serviceId: string;
  description: string;
  diffContent?: string;
  nodes?: ServiceNode[];
  edges?: DependencyEdge[];
}

export interface AnalysisResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedServices: string[];
  directImpacts: string[];
  indirectImpacts: string[];
  databasesAffected: string[];
  externalAffected: string[];
  reasons: string[];
  recommendedActions: string[];
  dependencyDepth: number;
  confidenceNotes?: string[];
}

export function analyzeChange(request: AnalysisRequest): AnalysisResult {
  const { changeType, serviceId, description, diffContent, nodes = mockNodes, edges = mockEdges } = request;
  
  const textToAnalyze = `${description} ${diffContent || ''}`.toLowerCase();
  const isBreaking = textToAnalyze.includes('remove') || 
                     textToAnalyze.includes('breaking') || 
                     textToAnalyze.includes('delete') ||
                     textToAnalyze.includes('deprecated') ||
                     textToAnalyze.includes('change type') ||
                     textToAnalyze.includes('schema mismatch');

  const isConfig = changeType.includes('Configuration') || textToAnalyze.includes('env') || textToAnalyze.includes('config');
  const isDatabase = changeType.includes('Database') || textToAnalyze.includes('migration') || textToAnalyze.includes('table');

  // 1. Upstream callers (components that call or depend on this service)
  const directEdges = edges.filter(e => e.target === serviceId);
  const directImpacts = Array.from(new Set(directEdges.map(e => e.source)));

  const indirectImpactsSet = new Set<string>();
  directImpacts.forEach(di => {
    const indirectEdges = edges.filter(e => e.target === di);
    indirectEdges.forEach(e => {
      if (e.source !== serviceId && !directImpacts.includes(e.source)) {
        indirectImpactsSet.add(e.source);
      }
    });
  });

  // 2. Downstream dependencies (components called or consumed by this service)
  const downstreamEdges = edges.filter(e => e.source === serviceId);
  const downstreamTargets = Array.from(new Set(downstreamEdges.map(e => e.target)));

  // Secondary downstream ripple (e.g. Payment -> Analytics -> Warehouse)
  const secondaryDownstreamSet = new Set<string>();
  downstreamTargets.forEach(dt => {
    const nextEdges = edges.filter(e => e.source === dt);
    nextEdges.forEach(ne => {
      if (ne.target !== serviceId && !downstreamTargets.includes(ne.target)) {
        secondaryDownstreamSet.add(ne.target);
      }
    });
  });

  const allDownstream = [...new Set([...downstreamTargets, ...Array.from(secondaryDownstreamSet)])];

  const databasesAffected = allDownstream.filter(d => {
    const node = nodes.find(n => n.id === d);
    return node?.type === 'database' || d.endsWith('-db');
  });

  const externalAffected = allDownstream.filter(d => {
    const node = nodes.find(n => n.id === d);
    return node?.type === 'external' || d.endsWith('-provider') || d.endsWith('-api');
  });

  const downstreamServices = allDownstream.filter(d => {
    const node = nodes.find(n => n.id === d);
    return !databasesAffected.includes(d) && !externalAffected.includes(d) && d !== 'infrastructure';
  });

  // Calculate dependency depth
  let depth = 1;
  if (directImpacts.length > 0 || downstreamTargets.length > 0) depth = 2;
  if (indirectImpactsSet.size > 0 || secondaryDownstreamSet.size > 0) depth = 3;

  // Transparent risk score calculation
  let score = 12;

  if (isBreaking) score += 40;
  if (changeType === 'API Change' && isBreaking) score += 15;
  if (isDatabase) score += 25;
  if (isConfig) score += 18;

  score += (directImpacts.length * 7);
  score += (indirectImpactsSet.size * 4);
  score += (downstreamServices.length * 5);
  score += (databasesAffected.length * 6);

  const targetService = nodes.find(n => n.id === serviceId);
  if (targetService?.criticality === 'critical') score += 20;
  else if (targetService?.criticality === 'high') score += 12;
  else if (targetService?.criticality === 'medium') score += 6;

  // Historical incident checks if matching service
  const similarIncidents = mockIncidents.filter(inc => 
    inc.impactedServices.includes(serviceId) && 
    (inc.title.toLowerCase().includes(changeType.toLowerCase()) || 
     (changeType === 'API Change' && inc.title.toLowerCase().includes('api')))
  );

  if (similarIncidents.length > 0) score += 12;

  score = Math.min(100, Math.max(10, score));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (score >= 80) riskLevel = 'CRITICAL';
  else if (score >= 60) riskLevel = 'HIGH';
  else if (score >= 35) riskLevel = 'MEDIUM';

  const affectedServices = [...new Set([...directImpacts, ...Array.from(indirectImpactsSet), ...downstreamServices])];

  // Transparent explanations (using conservative, objective language)
  const reasons: string[] = [];
  if (isBreaking) {
    reasons.push(`Detected potential breaking change in ${targetService?.label || serviceId} schema/contract`);
  }
  if (directImpacts.length > 0) {
    reasons.push(`Directly affects ${directImpacts.length} downstream consumer components`);
  }
  if (indirectImpactsSet.size > 0) {
    reasons.push(`Possible downstream effect cascading across ${indirectImpactsSet.size} indirect modules`);
  }
  if (targetService?.criticality === 'critical') {
    reasons.push(`${targetService.label} is identified on the critical traffic path`);
  }
  if (databasesAffected.length > 0) {
    reasons.push(`Direct state storage interaction with ${databasesAffected.length} database reference(s)`);
  }
  if (similarIncidents.length > 0) {
    reasons.push(`Pattern matches historical incident record ${similarIncidents[0].id}`);
  }
  if (score < 30) {
    reasons.push('Backward compatible change pattern detected');
    reasons.push('No direct downstream contract disruption identified');
  }

  // Recommended validation steps
  const recommendedActions: string[] = [];
  if (isBreaking) {
    const directNames = directImpacts.map(id => nodes.find(n => n.id === id)?.label || id).slice(0, 3).join(', ');
    recommendedActions.push(`Run contract integration suite for ${directNames || 'downstream consumers'}`);
    recommendedActions.push('Verify API contract compatibility in staging environment');
    recommendedActions.push('Establish backwards-compatible dual-read transition phase');
  } else {
    recommendedActions.push('Proceed with standard CI/CD deployment pipeline');
    recommendedActions.push('Verify deployment telemetry and error budget in canary stage');
  }

  if (databasesAffected.length > 0) {
    recommendedActions.push('Validate non-locking migration scripts against read replicas');
  }

  return {
    riskScore: score,
    riskLevel,
    affectedServices,
    directImpacts,
    indirectImpacts: Array.from(indirectImpactsSet),
    databasesAffected,
    externalAffected,
    reasons,
    recommendedActions,
    dependencyDepth: depth,
    confidenceNotes: [
      'Static dependency analysis derived from module graphs and route contracts',
      'Runtime dynamic dependency generation requires staging validation'
    ]
  };
}
