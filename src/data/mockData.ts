export type ArchitectureNodeType = 
  | 'application' 
  | 'gateway' 
  | 'service' 
  | 'worker' 
  | 'component' 
  | 'database' 
  | 'event' 
  | 'external' 
  | 'infrastructure' 
  | 'config';

export interface ServiceNode {
  id: string;
  label: string;
  type: 'service' | 'database' | 'external' | ArchitectureNodeType;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  description: string;
  layer?: number; // 1: App, 2: Gateway, 3: Services, 4: Workers/Events, 5: Data, 6: External/Infra
  group?: string; // 'FRONTEND' | 'API / GATEWAY' | 'CORE SERVICES' | 'WORKERS / EVENTS' | 'DATA' | 'EXTERNAL / INFRA'
  filePath?: string;
  metadata?: Record<string, any>;
}

export type EdgeSemanticType = 
  | 'CALLS' 
  | 'IMPORTS' 
  | 'DEPENDS_ON' 
  | 'READS' 
  | 'WRITES' 
  | 'PUBLISHES' 
  | 'CONSUMES' 
  | 'CONNECTS_TO' 
  | 'USES_DATABASE' 
  | 'USES_EXTERNAL_API' 
  | 'DETECTED_DEPENDENCY';

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  type: 'sync' | 'async' | EdgeSemanticType | string;
  semanticType?: EdgeSemanticType | string;
  label?: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence?: {
    file: string;
    snippet?: string;
    reason?: string;
  };
}

export const mockNodes: ServiceNode[] = [
  { id: 'api-gateway', label: 'API Gateway', type: 'gateway', layer: 2, group: 'API / GATEWAY', criticality: 'critical', owner: 'Platform Team', description: 'Main ingress for all traffic' },
  { id: 'auth-service', label: 'Auth Service', type: 'service', layer: 3, group: 'CORE SERVICES', criticality: 'critical', owner: 'Security Team', description: 'Handles authentication and authorization' },
  { id: 'user-service', label: 'User Service', type: 'service', layer: 3, group: 'CORE SERVICES', criticality: 'high', owner: 'Core Product', description: 'Manages user profiles and settings' },
  { id: 'order-service', label: 'Order Service', type: 'service', layer: 3, group: 'CORE SERVICES', criticality: 'critical', owner: 'Commerce', description: 'Processes and tracks customer orders' },
  { id: 'payment-service', label: 'Payment Service', type: 'service', layer: 3, group: 'CORE SERVICES', criticality: 'critical', owner: 'Payments', description: 'Handles transaction processing' },
  { id: 'fraud-service', label: 'Fraud Service', type: 'service', layer: 3, group: 'CORE SERVICES', criticality: 'high', owner: 'Risk', description: 'Analyzes transactions for fraud' },
  { id: 'inventory-service', label: 'Inventory Service', type: 'service', layer: 3, group: 'CORE SERVICES', criticality: 'high', owner: 'Supply Chain', description: 'Tracks product stock levels' },
  { id: 'notification-service', label: 'Notification Service', type: 'worker', layer: 4, group: 'WORKERS / EVENTS', criticality: 'medium', owner: 'Communications', description: 'Sends emails and push notifications' },
  { id: 'analytics-service', label: 'Analytics Service', type: 'worker', layer: 4, group: 'WORKERS / EVENTS', criticality: 'low', owner: 'Data Team', description: 'Collects usage metrics' },
  
  { id: 'user-db', label: 'User DB', type: 'database', layer: 5, group: 'DATA', criticality: 'critical', owner: 'Core Product', description: 'PostgreSQL - User data' },
  { id: 'order-db', label: 'Order DB', type: 'database', layer: 5, group: 'DATA', criticality: 'critical', owner: 'Commerce', description: 'PostgreSQL - Order data' },
  { id: 'payment-db', label: 'Payment DB', type: 'database', layer: 5, group: 'DATA', criticality: 'critical', owner: 'Payments', description: 'PostgreSQL - Payment ledger' },
  
  { id: 'email-provider', label: 'Email Provider', type: 'external', layer: 6, group: 'EXTERNAL / INFRA', criticality: 'medium', owner: 'Communications', description: 'Third-party email service' },
  { id: 'payment-gateway', label: 'Payment Gateway', type: 'external', layer: 6, group: 'EXTERNAL / INFRA', criticality: 'critical', owner: 'Payments', description: 'External payment processor' }
];

export const mockEdges: DependencyEdge[] = [
  { id: 'e1', source: 'api-gateway', target: 'auth-service', type: 'sync' },
  { id: 'e2', source: 'api-gateway', target: 'user-service', type: 'sync' },
  { id: 'e3', source: 'api-gateway', target: 'order-service', type: 'sync' },
  { id: 'e4', source: 'api-gateway', target: 'payment-service', type: 'sync' },
  
  { id: 'e5', source: 'user-service', target: 'user-db', type: 'sync' },
  { id: 'e6', source: 'order-service', target: 'user-service', type: 'sync' },
  { id: 'e7', source: 'order-service', target: 'order-db', type: 'sync' },
  { id: 'e8', source: 'order-service', target: 'inventory-service', type: 'sync' },
  { id: 'e9', source: 'order-service', target: 'payment-service', type: 'sync' },
  
  { id: 'e10', source: 'payment-service', target: 'fraud-service', type: 'sync' },
  { id: 'e11', source: 'payment-service', target: 'payment-db', type: 'sync' },
  { id: 'e12', source: 'payment-service', target: 'payment-gateway', type: 'sync' },
  { id: 'e13', source: 'payment-service', target: 'notification-service', type: 'async' },
  { id: 'e14', source: 'order-service', target: 'notification-service', type: 'async' },
  
  { id: 'e15', source: 'notification-service', target: 'email-provider', type: 'sync' },
  
  { id: 'e16', source: 'api-gateway', target: 'analytics-service', type: 'async' },
  { id: 'e17', source: 'user-service', target: 'analytics-service', type: 'async' },
  { id: 'e18', source: 'order-service', target: 'analytics-service', type: 'async' },
  { id: 'e19', source: 'payment-service', target: 'analytics-service', type: 'async' }
];

export interface Incident {
  id: string;
  title: string;
  impactedServices: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  rootCause: string;
  date: string;
}

export const mockIncidents: Incident[] = [
  {
    id: 'INC-1042',
    title: 'Payment API contract change',
    impactedServices: ['order-service', 'notification-service'],
    severity: 'high',
    rootCause: 'Breaking API contract deployed without updating downstream consumers',
    date: '14 Sep 2026'
  },
  {
    id: 'INC-1037',
    title: 'Payment timeout reduction',
    impactedServices: ['order-service'],
    severity: 'medium',
    rootCause: 'Aggressive timeout configuration caused partial checkout failures',
    date: '02 Sep 2026'
  },
  {
    id: 'INC-1021',
    title: 'User Service DB migration lock',
    impactedServices: ['user-service', 'api-gateway'],
    severity: 'critical',
    rootCause: 'Long-running transaction locked users table during peak traffic',
    date: '18 Aug 2026'
  },
  {
    id: 'INC-0994',
    title: 'Fraud Service API rate limiting',
    impactedServices: ['payment-service'],
    severity: 'medium',
    rootCause: 'Unexpected burst traffic triggered internal rate limits',
    date: '05 Jul 2026'
  },
  {
    id: 'INC-0982',
    title: 'Invalid Email Provider credentials',
    impactedServices: ['notification-service'],
    severity: 'high',
    rootCause: 'Expired API token for external provider',
    date: '22 Jun 2026'
  }
];
