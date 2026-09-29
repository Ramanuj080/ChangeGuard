import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

async function generateSampleZip() {
  const zip = new JSZip();

  // Root configuration
  zip.file('package.json', JSON.stringify({
    name: 'ecommerce-distributed-system',
    version: '2.0.0',
    scripts: {
      dev: 'vite',
      build: 'tsc -b && vite build'
    },
    dependencies: {
      react: '^18.3.1',
      express: '^4.19.2',
      pg: '^8.11.5',
      stripe: '^14.15.0'
    }
  }, null, 2));

  zip.file('docker-compose.yml', `version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
  backend:
    build: ./backend
    ports:
      - "8080:8080"
  database:
    image: postgres:15
    environment:
      POSTGRES_DB: commerce_db
`);

  zip.file('tsconfig.json', JSON.stringify({ compilerOptions: { target: 'ES2022' } }));
  zip.file('.env.example', 'DATABASE_URL=postgresql://user:pass@localhost:5432/commerce_db\nSTRIPE_SECRET=sk_test_123');

  // Frontend service
  zip.file('frontend/src/App.tsx', `import React from 'react';
export function App() {
  return <div className="p-8">Storefront Application</div>;
}
`);

  // Backend API Gateway / Server
  zip.file('backend/src/server.ts', `import express from 'express';
import { orderRoutes } from './services/orders';
const app = express();
app.use('/api/orders', orderRoutes);
app.listen(8080);
`);

  // Services
  zip.file('services/orders/index.ts', `import express from 'express';
export const orderRoutes = express.Router();
orderRoutes.get('/', (req, res) => res.json({ orders: [] }));
orderRoutes.post('/checkout', (req, res) => res.json({ status: 'success' }));
`);

  zip.file('services/payments/index.ts', `import Stripe from 'stripe';
const stripe = new Stripe('key');
export async function processPayment(amount: number) {
  return stripe.charges.create({ amount });
}
`);

  // Database models
  zip.file('database/schema.sql', `CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255));
CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INT, amount DECIMAL);
`);

  const outDir = path.resolve('public');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const content = await zip.generateAsync({ type: 'nodebuffer' });
  const outPath = path.join(outDir, 'sample-project.zip');
  fs.writeFileSync(outPath, content);
  console.log('Successfully created sample ZIP at:', outPath);
}

generateSampleZip().catch(console.error);
