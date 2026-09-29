const { analyzeProjectFiles } = require('./test_analyzer.cjs');
const fs = require('fs');
const JSZip = require('jszip');

// Layout algorithm test
function computeArchitectureLayout(nodes, edges) {
  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 60;
  const GAP_X = 50;
  const LAYER_Y = [0, 50, 190, 340, 500, 660, 820]; // 1-indexed for layers 1..6

  // Group nodes by layer
  const layers = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  nodes.forEach(n => {
    const l = n.layer && layers[n.layer] ? n.layer : 3;
    layers[l].push(n);
  });

  // Calculate layer widths to center them
  let maxWidth = 0;
  for (let l = 1; l <= 6; l++) {
    const count = layers[l].length;
    if (count > 0) {
      const width = count * NODE_WIDTH + (count - 1) * GAP_X;
      if (width > maxWidth) maxWidth = width;
    }
  }
  maxWidth = Math.max(maxWidth, 900);

  const positionedNodes = [];
  const partitions = [];

  const GROUP_TITLES = {
    1: 'FRONTEND',
    2: 'API / GATEWAY',
    3: 'CORE SERVICES',
    4: 'WORKERS / EVENTS',
    5: 'DATA',
    6: 'EXTERNAL / INFRA'
  };

  for (let l = 1; l <= 6; l++) {
    const count = layers[l].length;
    if (count === 0) continue;

    const layerWidth = count * NODE_WIDTH + (count - 1) * GAP_X;
    const startX = Math.max(50, (maxWidth - layerWidth) / 2);
    const y = LAYER_Y[l];

    // Add partition bounding box
    partitions.push({
      id: `group-layer-${l}`,
      label: GROUP_TITLES[l],
      x: startX - 25,
      y: y - 35,
      width: layerWidth + 50,
      height: NODE_HEIGHT + 60
    });

    layers[l].forEach((node, idx) => {
      const x = startX + idx * (NODE_WIDTH + GAP_X);
      positionedNodes.push({
        ...node,
        position: { x, y }
      });
    });
  }

  return { positionedNodes, partitions };
}

async function testLayout() {
  const zips = [
    'D:/test files for changeguard/shopsphere-detailed.zip',
    'D:/test files for changeguard/fincore-detailed.zip',
    'D:/test files for changeguard/fleetflow-detailed.zip'
  ];

  for (const zipPath of zips) {
    const buffer = fs.readFileSync(zipPath);
    const zip = await JSZip.loadAsync(buffer);
    const fileMap = new Map();
    for (const [relPath, entry] of Object.entries(zip.files)) {
      if (!entry.dir) {
        const content = await entry.async('string');
        fileMap.set(relPath.replace(/\\/g, '/'), content);
      }
    }
    const { nodes, edges } = analyzeProjectFiles(fileMap);
    const { positionedNodes, partitions } = computeArchitectureLayout(nodes, edges);

    console.log('=== Layout for ' + zipPath.split('/').pop() + ' ===');
    console.log('Partitions count:', partitions.length);
    partitions.forEach(p => console.log(`  Partition: ${p.label} at (${p.x}, ${p.y}) size ${p.width}x${p.height}`));
    console.log('Positioned nodes count:', positionedNodes.length);
    positionedNodes.forEach(n => console.log(`  ${n.id}: (${n.position.x}, ${n.position.y})`));
    console.log('');
  }
}

testLayout().catch(console.error);
