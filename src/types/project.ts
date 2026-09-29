import { ServiceNode, DependencyEdge } from '../data/mockData';

export interface ProjectTechnology {
  languages: string[];
  frameworks: string[];
  buildSystem: string[];
  databases: string[];
}

export interface ProjectStats {
  filesAnalyzed: number;
  modulesDetected: number;
  dependenciesCount: number;
  apisDetected: number;
  databaseReferences: number;
  externalServices: number;
}

export interface AnalysisConfidence {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  detectedFrom: string[];
  potentiallyIncomplete: string[];
}

export interface DetectedEndpoint {
  method: string;
  path: string;
  sourceFile: string;
  serviceId: string;
}

export interface ProjectFileInfo {
  name: string;
  size: number;
}

export interface AnalyzedProject {
  id: string;
  name: string;
  isCustom: boolean;
  uploadedAt: string;
  fileInfo?: ProjectFileInfo;
  stats: ProjectStats;
  technology: ProjectTechnology;
  confidence: AnalysisConfidence;
  nodes: ServiceNode[];
  edges: DependencyEdge[];
  endpoints: DetectedEndpoint[];
  files: string[];
  rawDependencies?: string[];
  databasesList?: string[];
  externalServicesList?: string[];
}
