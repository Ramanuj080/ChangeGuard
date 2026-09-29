import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalyzedProject, ProjectFileInfo } from '../types/project';
import { mockNodes, mockEdges } from '../data/mockData';
import { AnalysisResult, AnalysisRequest } from '../utils/riskEngine';

export interface AppSettings {
  maxZipSizeMB: number;
  maxFiles: number;
  includeConfigAnalysis: boolean;
  includeDependencyAnalysis: boolean;
  includeApiAnalysis: boolean;
  analysisMode: 'Fast' | 'Standard' | 'Deep';
  animationEffects: boolean;
  cursorGlow: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  maxZipSizeMB: 50,
  maxFiles: 2500,
  includeConfigAnalysis: true,
  includeDependencyAnalysis: true,
  includeApiAnalysis: true,
  analysisMode: 'Standard',
  animationEffects: true,
  cursorGlow: true,
  reducedMotion: false,
};

// Default Demo Project based on the existing ChangeGuard simulated infrastructure
export const DEFAULT_DEMO_PROJECT: AnalyzedProject = {
  id: 'demo-ecommerce-cloud',
  name: 'ecommerce-distributed-core',
  isCustom: false,
  uploadedAt: 'Active Live Topology',
  stats: {
    filesAnalyzed: 342,
    modulesDetected: mockNodes.length,
    dependenciesCount: mockEdges.length,
    apisDetected: 18,
    databaseReferences: 4,
    externalServices: 2
  },
  technology: {
    languages: ['TypeScript', 'Python'],
    frameworks: ['Node.js / Express', 'FastAPI'],
    buildSystem: ['Docker Compose', 'Vite'],
    databases: ['PostgreSQL', 'Redis']
  },
  confidence: {
    level: 'HIGH',
    detectedFrom: [
      'TypeScript import statements',
      'package.json dependencies',
      'OpenAPI & REST route contracts',
      'Docker Compose service definitions'
    ],
    potentiallyIncomplete: [
      'Runtime-generated dependencies',
      'Third-party external infrastructure',
      'Environment-specific deployment secrets'
    ]
  },
  nodes: mockNodes,
  edges: mockEdges,
  endpoints: [
    { method: 'POST', path: '/v1/payments/charge', sourceFile: 'services/payment/api.ts', serviceId: 'payment-service' },
    { method: 'GET', path: '/v1/orders/:id', sourceFile: 'services/order/routes.ts', serviceId: 'order-service' },
    { method: 'POST', path: '/v1/auth/login', sourceFile: 'services/auth/index.ts', serviceId: 'auth-service' }
  ],
  files: [
    'services/payment-service/index.ts',
    'services/order-service/server.ts',
    'services/user-service/models.ts',
    'services/auth-service/jwt.ts',
    'docker-compose.yml',
    'package.json'
  ],
  rawDependencies: ['express', 'pg', 'redis', 'jsonwebtoken', 'fastapi', 'stripe', 'pydantic', 'uvicorn'],
  databasesList: ['PostgreSQL', 'Redis'],
  externalServicesList: ['Stripe Payments', 'SendGrid']
};

interface ProjectContextType {
  currentProject: AnalyzedProject;
  uploadedFile: ProjectFileInfo | null;
  lastAnalysis: { result: AnalysisResult; request: AnalysisRequest } | null;
  settings: AppSettings;
  setProject: (project: AnalyzedProject, fileMeta?: ProjectFileInfo) => void;
  resetToDemo: () => void;
  setLastAnalysis: (analysis: { result: AnalysisResult; request: AnalysisRequest } | null) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  hasCustomProject: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
  currentProject: DEFAULT_DEMO_PROJECT,
  uploadedFile: null,
  lastAnalysis: null,
  settings: DEFAULT_SETTINGS,
  setProject: () => {},
  resetToDemo: () => {},
  setLastAnalysis: () => {},
  updateSettings: () => {},
  hasCustomProject: false
});

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<AnalyzedProject>(DEFAULT_DEMO_PROJECT);
  const [uploadedFile, setUploadedFile] = useState<ProjectFileInfo | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<{ result: AnalysisResult; request: AnalysisRequest } | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('changeguard_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const handleSetProject = (project: AnalyzedProject, fileMeta?: ProjectFileInfo) => {
    setCurrentProject(project);
    if (fileMeta) {
      setUploadedFile(fileMeta);
    } else if (project.fileInfo) {
      setUploadedFile(project.fileInfo);
    }
  };

  const resetToDemo = () => {
    setCurrentProject(DEFAULT_DEMO_PROJECT);
    setUploadedFile(null);
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem('changeguard_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  return (
    <ProjectContext.Provider 
      value={{ 
        currentProject, 
        uploadedFile,
        lastAnalysis,
        settings,
        setProject: handleSetProject, 
        resetToDemo,
        setLastAnalysis,
        updateSettings,
        hasCustomProject: currentProject.isCustom
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
