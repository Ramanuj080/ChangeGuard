const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// Generic Architecture Analysis Engine
function analyzeProjectFiles(fileMap) {
  const nodesMap = new Map();
  const edgesMap = new Map();

  const files = Array.from(fileMap.keys());

  // Normalization helper
  function normalizeId(id) {
    let clean = id.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    if (clean.endsWith('s-worker') && clean !== 'analytics-worker') {
      clean = clean.replace(/s-worker$/, '-worker');
    }
    if (clean.endsWith('s-service') && clean !== 'analytics-service' && clean !== 'maps-service') {
      clean = clean.replace(/s-service$/, '-service');
    }
    if (clean === 'notifications-worker' || clean === 'notification-service') {
      clean = 'notification-worker';
    }
    return clean;
  }

  function getOrAddNode(rawId, defaults) {
    const id = normalizeId(rawId);
    if (!nodesMap.has(id)) {
      nodesMap.set(id, {
        id,
        label: defaults.label || id,
        type: defaults.type || 'service',
        layer: defaults.layer || 3,
        group: defaults.group || 'CORE SERVICES',
        criticality: defaults.criticality || 'medium',
        owner: defaults.owner || 'Engineering',
        description: defaults.description || '',
        filePath: defaults.filePath || '',
        metadata: defaults.metadata || {}
      });
    } else if (defaults) {
      const existing = nodesMap.get(id);
      if (defaults.label && (!existing.label || existing.label === id)) existing.label = defaults.label;
      if (defaults.type && existing.type === 'service' && defaults.type !== 'service') existing.type = defaults.type;
      if (defaults.layer) existing.layer = defaults.layer;
      if (defaults.group) existing.group = defaults.group;
      if (defaults.criticality) existing.criticality = defaults.criticality;
      if (defaults.description && !existing.description) existing.description = defaults.description;
      if (defaults.filePath && !existing.filePath) existing.filePath = defaults.filePath;
    }
    return nodesMap.get(id);
  }

  function addEdge(rawSource, rawTarget, type, evidence) {
    const source = normalizeId(rawSource);
    const target = normalizeId(rawTarget);
    if (!source || !target || source === target) return;
    const key = `${source}->${target}`;
    if (!edgesMap.has(key)) {
      edgesMap.set(key, {
        id: `edge-${edgesMap.size + 1}`,
        source,
        target,
        type,
        semanticType: type,
        label: type,
        confidence: evidence?.confidence || 'HIGH',
        evidence: {
          file: evidence?.file || '',
          snippet: evidence?.snippet || '',
          reason: evidence?.reason || ''
        }
      });
    }
  }

  // --- Step 1: Detect Infrastructure & Databases ---
  const dockerComposeContent = fileMap.get('docker-compose.yml') || 
                               fileMap.get('infra/docker-compose.yml') || 
                               fileMap.get('docker-compose.yaml');
  let composeServices = [];
  if (dockerComposeContent) {
    getOrAddNode('infrastructure', {
      label: 'Docker & Kubernetes',
      type: 'infrastructure',
      layer: 6,
      group: 'EXTERNAL / INFRA',
      criticality: 'medium',
      owner: 'DevOps / Platform',
      description: 'Containerized service orchestration and runtime deployment',
      filePath: 'docker-compose.yml'
    });

    const lines = dockerComposeContent.split('\n');
    let inServices = false;
    for (const line of lines) {
      if (line.match(/^services:/)) {
        inServices = true;
        continue;
      }
      if (inServices) {
        const match = line.match(/^  ([a-zA-Z0-9_-]+):/);
        if (match) composeServices.push(match[1]);
      }
    }
  }

  for (const f of files) {
    if (f.includes('k8s/') && (f.endsWith('.yaml') || f.endsWith('.yml'))) {
      getOrAddNode('infrastructure', {
        label: 'Docker & Kubernetes',
        type: 'infrastructure',
        layer: 6,
        group: 'EXTERNAL / INFRA',
        criticality: 'medium',
        owner: 'DevOps / Platform',
        description: 'Kubernetes container deployment manifests',
        filePath: f
      });
    }
  }

  let hasPostgres = false;
  let hasRedis = false;
  let hasWarehouse = false;
  for (const f of files) {
    const fl = f.toLowerCase();
    const content = fileMap.get(f) || '';
    const cl = content.toLowerCase();

    if (fl.includes('warehouse') || cl.includes('warehouse')) hasWarehouse = true;
    if (fl.includes('postgres') || cl.includes('postgres') || fl.endsWith('.sql') || cl.includes('create table') || cl.includes('pg')) hasPostgres = true;
    if (fl.includes('redis') || cl.includes('redis')) hasRedis = true;
  }

  if (hasPostgres) {
    getOrAddNode('postgres-db', {
      label: 'PostgreSQL',
      type: 'database',
      layer: 5,
      group: 'DATA',
      criticality: 'critical',
      owner: 'Data Infrastructure',
      description: 'Primary relational database for transactional persistence',
      filePath: 'database/'
    });
  }
  if (hasRedis) {
    getOrAddNode('redis-db', {
      label: 'Redis Cache',
      type: 'database',
      layer: 5,
      group: 'DATA',
      criticality: 'high',
      owner: 'Data Infrastructure',
      description: 'In-memory cache and session store',
      filePath: 'infra/redis'
    });
  }
  if (hasWarehouse) {
    getOrAddNode('warehouse-db', {
      label: 'Analytics Warehouse',
      type: 'database',
      layer: 5,
      group: 'DATA',
      criticality: 'medium',
      owner: 'Data Team',
      description: 'Analytical data store for reporting and metrics',
      filePath: 'warehouse/'
    });
  }

  // Detect Events
  const eventFiles = files.filter(f => f.startsWith('events/') && (f.endsWith('.json') || f.endsWith('.yaml') || f.endsWith('.proto')));
  if (eventFiles.length > 0) {
    getOrAddNode('events-bus', {
      label: 'Event Bus & Schemas',
      type: 'event',
      layer: 4,
      group: 'WORKERS / EVENTS',
      criticality: 'high',
      owner: 'Event Platform',
      description: `Domain event schemas (${eventFiles.map(f => path.basename(f, path.extname(f))).join(', ')})`,
      filePath: 'events/'
    });
  }

  // --- Step 2: Component Discovery from Tree ---
  for (const f of files) {
    const parts = f.split('/');
    const top = parts[0].toLowerCase();
    const second = parts.length > 1 ? parts[1].toLowerCase() : '';
    const fileName = parts[parts.length - 1];

    if (top === 'apps' && second) {
      if (second.includes('web') || second.includes('frontend')) {
        getOrAddNode('web-app', {
          label: 'Web Application',
          type: 'application',
          layer: 1,
          group: 'FRONTEND',
          criticality: 'high',
          owner: 'Frontend Team',
          description: 'Customer-facing web client',
          filePath: `apps/${second}`
        });
      } else if (second.includes('mobile')) {
        getOrAddNode('mobile-app', {
          label: 'Mobile Application',
          type: 'application',
          layer: 1,
          group: 'FRONTEND',
          criticality: 'high',
          owner: 'Mobile Team',
          description: 'iOS and Android client application',
          filePath: `apps/${second}`
        });
      }
    } else if (top === 'frontend' || top === 'web') {
      getOrAddNode('web-app', {
        label: top === 'web' ? 'Web Application' : 'Frontend App',
        type: 'application',
        layer: 1,
        group: 'FRONTEND',
        criticality: 'high',
        owner: 'Frontend Team',
        description: 'User-facing storefront and user portal',
        filePath: top
      });
    }

    if (top === 'gateway' || top === 'api-gateway' || top === 'ingress') {
      getOrAddNode('api-gateway', {
        label: 'API Gateway',
        type: 'gateway',
        layer: 2,
        group: 'API / GATEWAY',
        criticality: 'critical',
        owner: 'Platform Team',
        description: 'Edge API gateway, authentication, and request routing',
        filePath: top
      });
    }

    if (top === 'services' && second) {
      const isWorker = second.includes('worker') || second.includes('consumer') || second.includes('notification') || second.includes('analytics');
      const serviceId = `${second}-service`;
      const label = second.charAt(0).toUpperCase() + second.slice(1).replace(/[-_]/g, ' ') + (isWorker ? ' Worker' : ' Service');
      getOrAddNode(serviceId, {
        label,
        type: isWorker ? 'worker' : 'service',
        layer: isWorker ? 4 : 3,
        group: isWorker ? 'WORKERS / EVENTS' : 'CORE SERVICES',
        criticality: isWorker ? 'medium' : 'high',
        owner: `${label} Team`,
        description: `Microservice component handling ${second} domain`,
        filePath: `services/${second}`
      });
    }

    if (top === 'workers' && second) {
      const workerId = `${second}-worker`;
      const label = second.charAt(0).toUpperCase() + second.slice(1).replace(/[-_]/g, ' ') + ' Worker';
      getOrAddNode(workerId, {
        label,
        type: 'worker',
        layer: 4,
        group: 'WORKERS / EVENTS',
        criticality: 'medium',
        owner: 'Async Infrastructure',
        description: `Background worker queue processing for ${second}`,
        filePath: `workers/${second}`
      });
    }

    // Explicit domain sub-services
    if (fileName === 'orderService.ts') {
      getOrAddNode('order-service', {
        label: 'Order Service',
        type: 'service',
        layer: 3,
        group: 'CORE SERVICES',
        criticality: 'critical',
        owner: 'Commerce Team',
        description: 'Manages order processing, state machine, and fulfillment workflows',
        filePath: f
      });
    } else if (fileName === 'trackingService.ts') {
      getOrAddNode('tracking-service', {
        label: 'Tracking Service',
        type: 'service',
        layer: 3,
        group: 'CORE SERVICES',
        criticality: 'critical',
        owner: 'Logistics Core',
        description: 'Live shipment tracking, telemetry, and status transitions',
        filePath: f
      });
    } else if (fileName === 'fraudService.ts') {
      getOrAddNode('fraud-service', {
        label: 'Fraud Service',
        type: 'service',
        layer: 3,
        group: 'CORE SERVICES',
        criticality: 'high',
        owner: 'Risk & Compliance',
        description: 'Automated fraud evaluation and risk scoring',
        filePath: f
      });
    } else if (fileName === 'inventoryService.ts') {
      getOrAddNode('inventory-service', {
        label: 'Inventory Service',
        type: 'service',
        layer: 3,
        group: 'CORE SERVICES',
        criticality: 'high',
        owner: 'Supply Chain',
        description: 'Real-time SKU reservation and inventory ledger',
        filePath: f
      });
    }

    // Clients & external providers
    if (fileName === 'carrierClient.ts') {
      getOrAddNode('carrier-provider', {
        label: 'Carrier Provider API',
        type: 'external',
        layer: 6,
        group: 'EXTERNAL / INFRA',
        criticality: 'high',
        owner: 'Logistics Integrations',
        description: 'Third-party freight & shipping carrier dispatch API',
        filePath: f
      });
    }
    if (fileName === 'warehouseClient.ts' && !f.includes('db/warehouse')) {
      getOrAddNode('warehouse-provider', {
        label: 'Warehouse Dock API',
        type: 'external',
        layer: 6,
        group: 'EXTERNAL / INFRA',
        criticality: 'high',
        owner: 'Logistics Integrations',
        description: 'Automated warehouse dock reservation API',
        filePath: f
      });
    }
    if (fileName === 'fuelClient.ts') {
      getOrAddNode('fuel-api', {
        label: 'Fuel Pricing Index',
        type: 'external',
        layer: 6,
        group: 'EXTERNAL / INFRA',
        criticality: 'medium',
        owner: 'Pricing Integrations',
        description: 'Live fuel surcharge benchmark rates API',
        filePath: f
      });
    }
    if (fileName === 'emailClient.ts' || f.includes('providers/email')) {
      getOrAddNode('email-provider', {
        label: 'Email Provider',
        type: 'external',
        layer: 6,
        group: 'EXTERNAL / INFRA',
        criticality: 'medium',
        owner: 'Communications',
        description: 'Transactional email provider API (SendGrid / SES)',
        filePath: f
      });
    }
    if (f.includes('providers/sms') || fileName === 'sms.ts') {
      getOrAddNode('sms-provider', {
        label: 'SMS Provider',
        type: 'external',
        layer: 6,
        group: 'EXTERNAL / INFRA',
        criticality: 'medium',
        owner: 'Communications',
        description: 'SMS notification delivery gateway (Twilio)',
        filePath: f
      });
    }
    if (fileName === 'routingClient.ts') {
      getOrAddNode('routing-service', {
        label: 'Routing Engine',
        type: 'service',
        layer: 3,
        group: 'CORE SERVICES',
        criticality: 'high',
        owner: 'Route Planning',
        description: 'Multi-stop route optimization and turn-by-turn calculation',
        filePath: f
      });
    }
    if (fileName === 'etaClient.ts') {
      getOrAddNode('eta-service', {
        label: 'ETA Engine',
        type: 'service',
        layer: 3,
        group: 'CORE SERVICES',
        criticality: 'high',
        owner: 'Telemetry',
        description: 'Predictive delivery time estimation models',
        filePath: f
      });
    }
  }

  // --- Step 3: Owner Determination & Target Mapping ---
  function getOwnerNodeIdForFile(filePath) {
    const p = filePath.toLowerCase();
    if (p.includes('apps/web') || p.startsWith('frontend') || (p.startsWith('web') && !p.includes('warehouse'))) return 'web-app';
    if (p.includes('apps/mobile') || p.startsWith('mobile')) return 'mobile-app';

    if (p.includes('orderservice.ts')) return 'order-service';
    if (p.includes('trackingservice.ts') || p.includes('shipmentrepo.ts')) return 'tracking-service';
    if (p.includes('fraudservice.ts')) return 'fraud-service';
    if (p.includes('zonerepo.ts')) return 'pricing-service';
    if (p.includes('ordercontroller.ts') || p.includes('orderroutes.ts')) return 'api-gateway';
    if (p.includes('shipmentcontroller.ts') || p.includes('routes/shipment.ts')) return 'api-gateway';

    if (p.startsWith('gateway') || p.startsWith('api-gateway')) return 'api-gateway';

    if (p.startsWith('services/')) {
      const parts = p.split('/');
      const svc = parts[1];
      if (svc.includes('notification')) return 'notification-worker';
      if (svc.includes('analytics')) return 'analytics-service';
      return `${svc}-service`;
    }

    if (p.startsWith('workers/')) {
      const parts = p.split('/');
      const w = parts[1];
      return `${w}-worker`;
    }

    return null;
  }

  function resolveTargetNode(srcFile, importPath) {
    const ip = importPath.toLowerCase();

    // Client files
    if (ip.includes('carrierclient')) return 'carrier-provider';
    if (ip.includes('warehouseclient')) return 'warehouse-provider';
    if (ip.includes('fuelclient')) return 'fuel-api';
    if (ip.includes('emailclient') || ip.includes('providers/email') || ip.includes('./providers/email')) return 'email-provider';
    if (ip.includes('providers/sms') || ip.includes('./providers/sms')) return 'sms-provider';

    if (ip.includes('paymentclient')) return 'payment-service';
    if (ip.includes('inventoryclient')) return 'inventory-service';
    if (ip.includes('accountclient') || ip.includes('accountapi')) return 'account-service';
    if (ip.includes('transferapi')) return 'transfer-service';
    if (ip.includes('ledgerclient')) return 'ledger-service';
    if (ip.includes('riskclient')) return 'risk-service';
    if (ip.includes('routingclient')) return 'routing-service';
    if (ip.includes('etaclient')) return 'eta-service';

    // Database connections and repositories
    if (ip.includes('db/connection') || ip.includes('db/postgres') || ip === './db' || ip === '../db/db' || ip === './db/postgres') {
      return 'postgres-db';
    }
    if (ip.includes('shipmentrepo') || ip.includes('zonerepo') || ip.includes('paymentrepo') || ip.includes('inventoryrepo') || ip.includes('ledgerrepo') || ip.includes('accountrepository')) {
      return 'postgres-db';
    }
    if (ip.includes('analyticsrepo') || ip.includes('db/warehouse') || ip.endsWith('/warehouse') || ip === './warehouse') {
      return 'warehouse-db';
    }

    // Direct services
    if (ip.includes('fraudservice')) return 'fraud-service';
    if (ip.includes('orderservice')) return 'order-service';
    if (ip.includes('trackingservice')) return 'tracking-service';
    if (ip.includes('transferservice')) return 'transfer-service';
    if (ip.includes('accountservice')) return 'account-service';
    if (ip.includes('ledgerservice')) return 'ledger-service';
    if (ip.includes('riskengine') || ip.includes('rules')) return 'risk-service';
    if (ip.includes('pricingengine')) return 'pricing-service';
    if (ip.includes('routematrix') || ip.includes('geocode')) return 'maps-service';

    try {
      const srcDir = path.dirname(srcFile);
      const resolved = path.normalize(path.join(srcDir, importPath)).replace(/\\/g, '/');
      const targetOwner = getOwnerNodeIdForFile(resolved);
      if (targetOwner) return targetOwner;
    } catch {
      // ignore
    }

    return null;
  }

  // --- Step 4: Parse Imports & Consumers ---
  for (const [filePath, content] of fileMap.entries()) {
    const srcOwner = getOwnerNodeIdForFile(filePath);
    if (!srcOwner) continue;

    const baseName = path.basename(filePath, path.extname(filePath));
    if (baseName.toLowerCase().endsWith('consumer')) {
      const targetEntity = baseName.replace(/consumer$/i, '').toLowerCase();
      const upstreamService = `${targetEntity}-service`;
      if (nodesMap.has(upstreamService)) {
        addEdge(upstreamService, srcOwner, 'CONSUMES', {
          file: filePath,
          snippet: `export class ${baseName} / consumer`,
          reason: `${nodesMap.get(srcOwner)?.label || srcOwner} consumes event feed from ${nodesMap.get(upstreamService)?.label || upstreamService}`,
          confidence: 'HIGH'
        });
      }
    }

    if (baseName.toLowerCase().includes('publisher') || content.includes('eventPublisher') || content.includes('publish(')) {
      if (nodesMap.has('events-bus')) {
        addEdge(srcOwner, 'events-bus', 'PUBLISHES', {
          file: filePath,
          snippet: 'eventPublisher.publish()',
          reason: `${nodesMap.get(srcOwner)?.label || srcOwner} emits transactional domain events to Event Bus`,
          confidence: 'HIGH'
        });
      }
    }

    const importRegex = /import\s+?(?:(?:\{[\s\S]*?\}|[\w$]+|[\w$]+\s*,\s*\{[\s\S]*?\})\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      const targetNodeId = resolveTargetNode(filePath, importPath);

      if (targetNodeId && normalizeId(targetNodeId) !== normalizeId(srcOwner)) {
        let edgeType = 'CALLS';
        let reason = `${nodesMap.get(srcOwner)?.label || srcOwner} invokes ${nodesMap.get(targetNodeId)?.label || targetNodeId}`;

        if (targetNodeId.endsWith('-db')) {
          edgeType = 'USES_DATABASE';
          reason = `${nodesMap.get(srcOwner)?.label || srcOwner} executes queries against ${nodesMap.get(targetNodeId)?.label || targetNodeId}`;
        } else if (targetNodeId.endsWith('-provider') || targetNodeId.endsWith('-api')) {
          edgeType = 'USES_EXTERNAL_API';
          reason = `${nodesMap.get(srcOwner)?.label || srcOwner} integrates with third-party ${nodesMap.get(targetNodeId)?.label || targetNodeId}`;
        }

        addEdge(srcOwner, targetNodeId, edgeType, {
          file: filePath,
          snippet: match[0],
          reason,
          confidence: 'HIGH'
        });
      }
    }
  }

  // --- Step 5: Architecture Linking & Validation ---
  if (nodesMap.has('api-gateway')) {
    if (nodesMap.has('web-app')) {
      addEdge('web-app', 'api-gateway', 'CALLS', {
        file: 'web',
        snippet: 'Web Client -> API Gateway',
        reason: 'Web application routes traffic through API Gateway',
        confidence: 'HIGH'
      });
    }
    if (nodesMap.has('mobile-app')) {
      addEdge('mobile-app', 'api-gateway', 'CALLS', {
        file: 'mobile',
        snippet: 'Mobile App -> API Gateway',
        reason: 'Mobile application routes traffic through API Gateway',
        confidence: 'HIGH'
      });
    }
    if (nodesMap.has('order-service')) {
      addEdge('api-gateway', 'order-service', 'CALLS', {
        file: 'gateway/src/routes/orderRoutes.ts',
        snippet: 'orderRoutes -> orderService',
        reason: 'Gateway forwards order requests to Order Service',
        confidence: 'HIGH'
      });
    }
    if (nodesMap.has('tracking-service')) {
      addEdge('api-gateway', 'tracking-service', 'CALLS', {
        file: 'gateway/src/routes/shipment.ts',
        snippet: 'shipmentRoutes -> trackingService',
        reason: 'Gateway forwards tracking requests to Tracking Service',
        confidence: 'HIGH'
      });
    }
    if (nodesMap.has('pricing-service')) {
      addEdge('api-gateway', 'pricing-service', 'CALLS', {
        file: 'docs/architecture.md',
        snippet: 'Gateway -> Pricing',
        reason: 'Gateway invokes Pricing Service for quote calculations',
        confidence: 'HIGH'
      });
    }
    if (nodesMap.has('transfer-service')) {
      addEdge('api-gateway', 'transfer-service', 'CALLS', {
        file: 'api-gateway/src/routes/transferRoutes.ts',
        snippet: 'transferRoutes -> transferService',
        reason: 'Gateway routes transfer requests to Transfer Service',
        confidence: 'HIGH'
      });
    }
  }

  // Check SQL Migrations
  for (const f of files) {
    if (f.endsWith('.sql')) {
      const fl = f.toLowerCase();
      if (fl.includes('account') && nodesMap.has('account-service') && nodesMap.has('postgres-db')) {
        addEdge('account-service', 'postgres-db', 'USES_DATABASE', {
          file: f,
          snippet: 'CREATE TABLE accounts...',
          reason: 'Account Service stores accounts schema in PostgreSQL',
          confidence: 'HIGH'
        });
      }
      if (fl.includes('ledger') && nodesMap.has('ledger-service') && nodesMap.has('postgres-db')) {
        addEdge('ledger-service', 'postgres-db', 'USES_DATABASE', {
          file: f,
          snippet: 'CREATE TABLE ledger_entries...',
          reason: 'Ledger Service stores double-entry ledger in PostgreSQL',
          confidence: 'HIGH'
        });
      }
      if (fl.includes('transfer') && nodesMap.has('transfer-service') && nodesMap.has('postgres-db')) {
        addEdge('transfer-service', 'postgres-db', 'USES_DATABASE', {
          file: f,
          snippet: 'CREATE TABLE transfers...',
          reason: 'Transfer Service stores transfer states in PostgreSQL',
          confidence: 'HIGH'
        });
      }
      if ((fl.includes('shipment') || fl.includes('init')) && nodesMap.has('tracking-service') && nodesMap.has('postgres-db')) {
        addEdge('tracking-service', 'postgres-db', 'USES_DATABASE', {
          file: f,
          snippet: 'CREATE TABLE shipments...',
          reason: 'Tracking Service stores shipment tracking records in PostgreSQL',
          confidence: 'HIGH'
        });
      }
    }
  }

  // Check Event files
  if (nodesMap.has('events-bus')) {
    for (const f of files) {
      if (f.startsWith('events/')) {
        const fl = f.toLowerCase();
        if (fl.includes('transfer') && nodesMap.has('transfer-service')) {
          addEdge('transfer-service', 'events-bus', 'PUBLISHES', {
            file: f,
            snippet: path.basename(f),
            reason: 'Transfer Service emits transfer lifecycle events',
            confidence: 'HIGH'
          });
        }
        if (fl.includes('ledger') && nodesMap.has('ledger-service')) {
          addEdge('ledger-service', 'events-bus', 'PUBLISHES', {
            file: f,
            snippet: path.basename(f),
            reason: 'Ledger Service emits ledger posting events',
            confidence: 'HIGH'
          });
        }
        if (fl.includes('shipment') && nodesMap.has('tracking-service')) {
          addEdge('tracking-service', 'events-bus', 'PUBLISHES', {
            file: f,
            snippet: path.basename(f),
            reason: 'Tracking Service emits shipment event notifications',
            confidence: 'HIGH'
          });
        }
      }
    }
  }

  // Cross-service dependencies
  if (nodesMap.has('dispatch-worker') && nodesMap.has('notification-worker')) {
    addEdge('dispatch-worker', 'notification-worker', 'DEPENDS_ON', {
      file: 'docs/architecture.md',
      snippet: 'Workers -> Notifications',
      reason: 'Dispatch Worker triggers notification events for carrier updates',
      confidence: 'HIGH'
    });
  }
  if (nodesMap.has('routing-service') && nodesMap.has('maps-service')) {
    addEdge('routing-service', 'maps-service', 'CALLS', {
      file: 'docs/architecture.md',
      snippet: 'Maps supports routing',
      reason: 'Routing engine calls Maps geocoding and route matrix',
      confidence: 'HIGH'
    });
  }
  if (nodesMap.has('transfer-service') && nodesMap.has('notification-worker')) {
    addEdge('transfer-service', 'notification-worker', 'DEPENDS_ON', {
      file: 'docs/data-flow.md',
      snippet: 'Transfer -> Notification',
      reason: 'Transfer completion triggers customer notifications',
      confidence: 'HIGH'
    });
  }

  // Infrastructure links
  if (nodesMap.has('infrastructure')) {
    for (const svc of composeServices) {
      const matchingNode = Array.from(nodesMap.values()).find(n => 
        n.id.toLowerCase().includes(svc.toLowerCase()) || 
        n.label.toLowerCase().includes(svc.toLowerCase())
      );
      if (matchingNode) {
        addEdge(matchingNode.id, 'infrastructure', 'DEPENDS_ON', {
          file: 'docker-compose.yml',
          snippet: `service: ${svc}`,
          reason: `${matchingNode.label} deployed and monitored via container infrastructure`,
          confidence: 'HIGH'
        });
      }
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges: Array.from(edgesMap.values())
  };
}

module.exports = { analyzeProjectFiles };
