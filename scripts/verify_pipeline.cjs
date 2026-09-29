const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// Import the analyzer function logic
const { analyzeProjectFiles } = require('./test_analyzer.cjs');

async function verifyAll() {
  const testFiles = [
    { name: 'ShopSphere', file: 'D:/test files for changeguard/shopsphere-detailed.zip' },
    { name: 'FinCore', file: 'D:/test files for changeguard/fincore-detailed.zip' },
    { name: 'FleetFlow', file: 'D:/test files for changeguard/fleetflow-detailed.zip' }
  ];

  console.log('========================================================================');
  console.log('CHANGEGUARD ARCHITECTURE PIPELINE VERIFICATION');
  console.log('========================================================================\n');

  for (const { name, file } of testFiles) {
    console.log(`>>> PROJECT: ${name} (${path.basename(file)})`);
    const buffer = fs.readFileSync(file);
    const zip = await JSZip.loadAsync(buffer);
    const fileMap = new Map();
    for (const [relPath, entry] of Object.entries(zip.files)) {
      if (!entry.dir) {
        const content = await entry.async('string');
        fileMap.set(relPath.replace(/\\/g, '/'), content);
      }
    }

    const { nodes, edges } = analyzeProjectFiles(fileMap);

    console.log(`\n  1. Node Classification & Architectural Partitioning:`);
    const layers = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    nodes.forEach(n => {
      layers[n.layer].push(n);
    });

    const layerNames = {
      1: 'Layer 1: Applications (FRONTEND)',
      2: 'Layer 2: Gateways (API / GATEWAY)',
      3: 'Layer 3: Core Services (CORE SERVICES)',
      4: 'Layer 4: Workers / Events (WORKERS / EVENTS)',
      5: 'Layer 5: Databases (DATA)',
      6: 'Layer 6: External & Infra (EXTERNAL / INFRA)'
    };

    for (let l = 1; l <= 6; l++) {
      console.log(`     [${layerNames[l]}]: ${layers[l].map(n => `${n.label} (${n.type})`).join(', ') || 'None'}`);
    }

    console.log(`\n  2. Detected Relationships (Edges) Count: ${edges.length}`);
    edges.forEach(e => {
      console.log(`     ${e.source} --[${e.type}]--> ${e.target}  | Evidence: ${e.evidence?.snippet || e.evidence?.reason || ''}`);
    });

    // Check branching and merging
    const outgoing = {};
    const incoming = {};
    edges.forEach(e => {
      outgoing[e.source] = (outgoing[e.source] || 0) + 1;
      incoming[e.target] = (incoming[e.target] || 0) + 1;
    });

    const branching = Object.keys(outgoing).filter(k => outgoing[k] > 1);
    const merging = Object.keys(incoming).filter(k => incoming[k] > 1);

    console.log(`\n  3. Non-Linear Graph Validation:`);
    console.log(`     ✓ Branching Nodes (out-degree > 1): ${branching.join(', ')}`);
    console.log(`     ✓ Merging Nodes (in-degree > 1): ${merging.join(', ')}`);
    console.log(`     ✓ Total Nodes: ${nodes.length}, Total Edges: ${edges.length}`);
    console.log('------------------------------------------------------------------------\n');
  }
}

verifyAll().catch(console.error);
