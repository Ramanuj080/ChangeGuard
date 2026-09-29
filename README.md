<div align="center">

  <img src="public/changeguard-logo.png" alt="ChangeGuard Logo" width="100" height="100" style="border-radius: 20px;" />

  # ChangeGuard

  ### Pre-Deployment Software Change Impact Analysis

  **Know the blast radius before you deploy.**

  <p>
    <em>Here, blast radius refers to the services and components that could potentially be affected by a software change.</em>
  </p>

  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-4.3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="TailwindCSS" /></a>
    <a href="https://reactflow.dev/"><img src="https://img.shields.io/badge/@xyflow/react-12.12-FF0072?style=flat-square" alt="React Flow" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-purple.svg?style=flat-square" alt="License: MIT" /></a>
  </p>

  <p>
    ChangeGuard is a client-side static software change impact analysis tool. It inspects uploaded project source files and configuration archives, infers architectural dependencies, visualizes multi-layer directed dependency graphs, simulates proposed code or configuration changes, calculates deterministic risk scores, and generates verification test plans before deployment.
  </p>

</div>

---

## Table of Contents

1. [What is ChangeGuard?](#what-is-changeguard)
2. [Why ChangeGuard?](#why-changeguard)
3. [Features](#features)
4. [How It Works](#how-it-works)
5. [Supported Analysis Inputs](#supported-analysis-inputs)
6. [Dependency Graph Model](#dependency-graph-model)
7. [Change Impact Analysis](#change-impact-analysis)
8. [Risk Scoring Engine](#risk-scoring-engine)
9. [Reports and Exports](#reports-and-exports)
10. [Privacy and Security Model](#privacy-and-security-model)
11. [Technology Stack](#technology-stack)
12. [Project Structure](#project-structure)
13. [Getting Started](#getting-started)
14. [Usage Walkthrough](#usage-walkthrough)
15. [Included Sample Projects](#included-sample-projects)
16. [Development and Scripts](#development-and-scripts)
17. [Limitations](#limitations)
18. [Planned Roadmap](#planned-roadmap)
19. [Contributing](#contributing)
20. [License](#license)

---

## What is ChangeGuard?

ChangeGuard is a static analysis utility that helps software engineers evaluate the potential upstream and downstream consequences of software modifications prior to deployment.

Rather than relying solely on mental models or manual documentation during code reviews, ChangeGuard enables teams to inspect detected service relationships, visualize dependency topology, and identify components that may require regression testing when an interface or configuration changes.

The core analysis pipeline follows this deterministic flow:

```
Project Archive (.zip)
  └── Source & Configuration Scanning
        └── Component & Dependency Detection
              └── Directed Graph Construction G = (V, E)
                    └── Hierarchical Layer Layout
                          └── Change Simulation (Form / Diff / Patch)
                                └── Upstream & Downstream Impact Traversal
                                      └── Deterministic Risk Scoring
                                            └── Test Plan Generation & Export (JSON / MD / PDF)
```

> **Note**: ChangeGuard is currently implemented as an in-browser static analysis and graph exploration tool. It is not an active runtime monitoring agent, APM tool, or production observability platform.

---

## Why ChangeGuard?

Modern software architectures comprise interconnected services, gateways, datastores, message queues, and external APIs. In these systems, small modifications—such as modifying an API response field, changing a database schema, or adjusting an environment variable—often introduce unanticipated side effects across consuming services.

In a conventional delivery cycle, reasoning about dependencies often happens reactively:

```
Proposed Change ──► Deployment ──► Production Failure ──► Incident Investigation
```

ChangeGuard aims to move this architectural reasoning earlier in the development lifecycle:

```
Proposed Change ──► Static Impact Analysis ──► Targeted Validation ──► Safer Deployment
```

By mapping identified relationships across project boundaries, ChangeGuard provides developers with an objective baseline to determine what tests should be executed before merging a change.

---

## Features

- **Client-Side Archive Extraction**: Unpacks `.zip` project archives in browser memory using JSZip without uploading files to a server.
- **Source and Configuration Scanner**: Analyzes code files, manifests, environment templates, API specs, and container definitions using pattern matching and regular expression heuristics.
- **Component Classification**: Identifies applications, edge gateways, domain microservices, background workers, event systems, databases, external providers, and infrastructure definitions.
- **Multi-Branch & Multi-Layer Directed Graph**: Generates directed graphs $G = (V, E)$ supporting one-to-many branching and many-to-one merging relationships, avoiding artificial linear sequences.
- **Explainable Relationship Inspector**: Click any graph edge to review supporting evidence, including source file paths, relevant code snippets, semantic relationship types, and detection confidence.
- **Change Simulation Modes**:
  - Structured parameter input (target service, change type, description).
  - Git unified diff text input.
  - `.diff` and `.patch` file upload.
  - Built-in high-risk and low-risk test presets.
- **Dual-Direction Impact Traversal**: Traces direct downstream consumers, secondary indirect consumers, datastore references, and upstream callers.
- **Deterministic Risk Engine**: Calculates risk scores (0–100) and classifications (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) based on transparent scoring factors.
- **Automated Test Plan Generation**: Assembles targeted test checklists covering contract compatibility, integration scenarios, regression areas, and mitigation procedures.
- **Multi-Format Export**: Generates machine-readable JSON, PR-ready Markdown, and multi-page printable PDF reports.
- **Synthetic Test Architectures**: Includes verified sample projects (`ShopSphere`, `FinCore`, `FleetFlow`) for immediate demonstration without requiring local files.

---

## How It Works

ChangeGuard executes analysis through an eleven-stage pipeline:

1. **Project Upload**: The user provides a `.zip` archive via drag-and-drop or selects a preloaded sample archive.
2. **Archive Extraction**: JSZip decompresses the archive in-memory, filtering out vendor folders, binaries, and ignored directories (`node_modules/`, `.git/`, `dist/`, etc.).
3. **Source and Configuration Scanning**: Reads text-based source files, manifests, Docker files, and SQL schemas to collect import paths, client references, routes, and connections.
4. **Dependency Detection**: Matches detected calls, clients, consumers, and database drivers against identified project components to extract relationships.
5. **Graph Construction**: Builds a directed graph $G = (V, E)$ where nodes represent components and edges represent semantic relationships.
6. **Architecture Layout**: Computes coordinate positions across 6 architectural tiers with grouped visual partitions.
7. **Change Simulation**: Ingests proposed change parameters, descriptions, and optional diff contents for a chosen service.
8. **Impact Traversal**: Performs breadth-first graph traversal from the target component to discover upstream callers and downstream dependencies.
9. **Risk Calculation**: Evaluates the blast radius, breaking change indicators, service criticality, and storage involvement to produce a deterministic score.
10. **Test Plan Generation**: Generates contextual verification steps tailored to the affected services and risk tier.
11. **Report Export**: Packages results into JSON, Markdown, or PDF formats for team review and documentation.

---

## Supported Analysis Inputs

ChangeGuard operates on two primary categories of input:

### 1. Project Archives
The scanner accepts `.zip` archives containing software project files. During extraction, it inspects:

| Category | File Patterns & Manifests Detected |
|---|---|
| **Package Manifests** | `package.json`, `requirements.txt`, `pom.xml`, `build.gradle`, `go.mod` |
| **Container & Infra** | `docker-compose.yml`, `docker-compose.yaml`, `Dockerfile`, Kubernetes manifests (`*.yaml`, `*.yml`) |
| **API & Data Specs** | OpenAPI / Swagger specs (`openapi.yaml`, `swagger.json`), SQL schemas (`*.sql`), Protobuf (`*.proto`) |
| **Source Code** | TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`), Python (`.py`), Java (`.java`), Go (`.go`) |

### 2. Change Simulation Parameters
To evaluate a proposed modification, ChangeGuard accepts:

- **Target Component**: The detected service or node being altered.
- **Change Category**:
  - `API Change`
  - `Database Migration`
  - `Configuration Update`
  - `Infrastructure / Deployment`
  - `Refactor / Internal`
- **Change Description**: Free-form natural language describing the intent of the change.
- **Unified Diff Content**: Direct patch text or uploaded `.diff`/`.patch` files indicating line additions and removals.

---

## Dependency Graph Model

ChangeGuard models software architecture as a directed dependency graph:

$$G = (V, E)$$

Where $V$ represents detected architectural components and $E$ represents directed relationships between those components.

### Node Classifications ($V$)

Components are classified into defined types and assigned to one of six architectural layers:

| Layer | Partition Group | Node Type | Example Detected Roles |
|:---:|---|---|---|
| **1** | `FRONTEND` | `application` | Web applications, mobile clients, frontend SPAs |
| **2** | `API / GATEWAY` | `gateway` | Edge routers, API gateways, reverse proxies |
| **3** | `CORE SERVICES` | `service` | Business logic services (e.g., Order, Payment, Inventory) |
| **4** | `WORKERS / EVENTS` | `worker`, `event` | Queue consumers, background workers, event message brokers |
| **5** | `DATA` | `database` | PostgreSQL, MySQL, Redis caches, analytical warehouses |
| **6** | `EXTERNAL / INFRA` | `external`, `infrastructure` | Third-party APIs (Stripe, Twilio, SendGrid), Docker/K8s infra |

### Edge Semantic Types ($E$)

Relationships between nodes carry explicit semantic types derived from code evidence:

- `CALLS`: Direct service-to-service HTTP/RPC client invocation.
- `IMPORTS`: Code-level module or package import.
- `DEPENDS_ON`: General architectural or deployment dependency.
- `READS` / `WRITES`: Datastore query or persistence interaction.
- `PUBLISHES`: Event or message emission to a broker or topic.
- `CONSUMES`: Event subscription or queue message consumption.
- `CONNECTS_TO`: Network connection reference.
- `USES_DATABASE`: Connection to a persistent datastore.
- `USES_EXTERNAL_API`: Integration with a third-party provider.
- `DETECTED_DEPENDENCY`: Fallback classification when a link is confirmed but the exact protocol is ambiguous.

Each edge stores an `evidence` object containing the source file name, line snippet, and rationale for explainability.

---

## Change Impact Analysis

When a change is simulated on a target component, the impact engine traverses the graph in both directions:

```
[Upstream Ingress / Gateway]
            │
      (calls target)
            ▼
   ┌─────────────────┐
   │ TARGET SERVICE  │  ◄── Modified by developer
   └─────────────────┘
      │           │
(calls downstream)│(queries database)
      ▼           ▼
[Downstream]  [Database]
      │
(cascades)
      ▼
[Secondary Worker]
```

- **Direct Impact**: Components that directly invoke the target service (callers whose contracts may break).
- **Downstream Dependencies**: Datastores, third-party providers, or downstream services called by the target.
- **Indirect Impact**: Secondary consumers two or more hops away that receive data cascaded from the target.
- **Upstream Callers**: Ingress points (such as API Gateways or Web clients) that expose the target to end users.

All impacted components are designated as **potentially affected** to reflect that static analysis identifies possible paths of ripple, not guaranteed runtime failure.

---

## Risk Scoring Engine

ChangeGuard uses a transparent, deterministic scoring algorithm implemented in `src/utils/riskEngine.ts`. The final score ranges from 10 to 100 and maps to discrete risk levels:

| Risk Tier | Score Range | Default Guidance |
|---|:---:|---|
| **LOW** | 10 – 34 | Routine change. Standard CI/CD validation and automated unit tests. |
| **MEDIUM** | 35 – 59 | Moderate risk. Requires targeted integration tests with immediate callers. |
| **HIGH** | 60 – 79 | Elevated risk. Multi-service integration suite and staging deployment recommended. |
| **CRITICAL** | 80 – 100 | Severe blast radius. Mandatory contract testing, database migration reviews, and canary deployments. |

### Scoring Factors

The score is calculated from the following base weights and multipliers:

1. **Base Score**: Starts at 12 points.
2. **Breaking Change Indicators**: +40 points if change text or diff contains breaking keywords (`remove`, `delete`, `deprecated`, `breaking`, `schema mismatch`).
3. **API Contract Disruption**: Additional +15 points if the change category is `API Change` and breaking keywords are present.
4. **Database Migration / Schema Change**: +25 points if the change involves datastores, tables, or migrations.
5. **Configuration Modifications**: +18 points if the change alters environment or configuration variables.
6. **Direct Impact Count**: +7 points per directly affected consuming component.
7. **Indirect Impact Count**: +4 points per secondary indirect component.
8. **Downstream Service Count**: +5 points per downstream service called.
9. **Database Reference Count**: +6 points per affected datastore.
10. **Service Criticality**: +20 points for `critical`, +12 for `high`, +6 for `medium`.
11. **Historical Incident Correlation**: +12 points if the service and change type match a known historical incident record.

> **Disclaimer**: The calculated score is an analytical estimate intended to guide testing focus. It does not replace code reviews, staging tests, or runtime observability.

---

## Reports and Exports

Once analysis is complete, results can be exported in three formats:

1. **JSON (`.json`)**:
   - Structured export of the `AnalysisExportData` schema.
   - Contains project metadata, node list, edge list, risk score, blast radius breakdown, confidence ratings, and test recommendations.
   - Suitable for offline archiving or custom tooling scripts.

2. **Markdown (`.md`)**:
   - Formatted human-readable report.
   - Formatted for direct inclusion in Pull Request descriptions, RFCs, or team documentation.

3. **PDF (`.pdf`)**:
   - Multi-page document generated via `jspdf` and `jspdf-autotable`.
   - Includes visual risk score banners, component breakdown tables, identified dependencies, test plans, and engineering sign-off fields.

---

## Privacy and Security Model

ChangeGuard is designed around local client-side processing:

- **Browser-Only Execution**: Archive decompression, regex-based source file parsing, and layout math run entirely in the user's browser runtime.
- **Zero Server Uploads**: Source code files, configuration files, and git diffs are not transmitted to any remote ChangeGuard backend server.
- **No Code Execution**: ChangeGuard inspects file contents as plain text; it does not execute scripts, run build tools, or evaluate untrusted code from uploaded archives.
- **Defensive Parsing Constraints**:
  - Maximum archive file limit (default: 2,500 files).
  - Maximum individual file read size: 5 MB.
  - Path traversal protection: Ignores archive entries containing `..` or root-relative paths.
  - Directory filtering: Automatically skips common dependency and output folders (`node_modules/`, `.git/`, `dist/`, `build/`, `.venv/`, `vendor/`, `target/`).
- **Untrusted Input Handling**: Uploaded codebases should always be treated as untrusted input. While static scanning does not execute code, users should exercise care when loading third-party archives.

---

## Technology Stack

ChangeGuard is built using modern frontend technologies:

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime / UI** | [React](https://react.dev/) | `^19.2.8` | Component architecture |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `~6.0.2` | Static type safety |
| **Bundler / Server** | [Vite](https://vitejs.dev/) | `^8.3.0` | Build tool and HMR dev server |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^4.3.3` | Utility styling and CSS layout |
| **Graph Canvas** | [@xyflow/react](https://reactflow.dev/) | `^12.12.0` | Interactive node-edge visualization |
| **ZIP Processing** | [JSZip](https://stuk.github.io/jszip/) | `^3.10.2` | In-browser client-side archive decompression |
| **PDF Generation** | [jsPDF](https://github.com/parallax/jsPDF) | `^4.2.1` | Vector PDF document generation |
| **PDF Tables** | [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) | `^5.0.8` | Formatted tables in PDF reports |
| **Icons** | [Lucide React](https://lucide.dev/) | `^1.48.0` | UI iconography |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) | `^13.4.4` | Modal and UI transitions |

---

## Project Structure

```
changeguard/
├── public/
│   ├── assets/
│   │   └── changeguard-logo.png      # Official shield logo image asset
│   ├── changeguard-logo.png          # Favicon and brand mark
│   ├── fincore-detailed.zip          # Synthetic banking test archive
│   ├── fleetflow-detailed.zip        # Synthetic logistics test archive
│   └── shopsphere-detailed.zip       # Synthetic e-commerce test archive
├── src/
│   ├── components/
│   │   ├── CursorGlow.tsx            # Ambient cursor glow component
│   │   ├── DependencyGraph.tsx       # React Flow architecture graph and custom nodes
│   │   ├── Layout.tsx                # Application shell, navigation, and settings modals
│   │   └── Logo.tsx                  # Brand shield logo component
│   ├── context/
│   │   └── ProjectContext.tsx        # React Context for active project and analysis state
│   ├── data/
│   │   └── mockData.ts               # Default fallback architecture nodes and incident history
│   ├── pages/
│   │   ├── Analyze.tsx               # Change simulation input page (form, diff, patch upload)
│   │   ├── Architecture.tsx          # Full-screen dependency graph and relationship inspector
│   │   ├── Incidents.tsx             # Historical incident lookup view
│   │   ├── Landing.tsx               # Overview landing page with interactive demo
│   │   ├── Results.tsx               # Blast radius results, risk meters, and export actions
│   │   └── UploadProject.tsx         # ZIP drag-and-drop interface and sample project loader
│   ├── types/
│   │   └── project.ts                # TypeScript interfaces for projects, endpoints, and stats
│   ├── utils/
│   │   ├── cn.ts                     # Tailwind class merging utility
│   │   ├── graphLayout.ts            # Deterministic 6-layer partition layout algorithm
│   │   ├── markdownExport.ts         # Markdown report formatting utility
│   │   ├── pdfExport.ts              # Multi-page executive PDF generator
│   │   ├── riskEngine.ts             # Blast radius traversal and deterministic risk engine
│   │   └── zipAnalyzer.ts            # Client-side source and configuration scanner
│   ├── App.tsx                       # Route configurations
│   ├── index.css                     # Tailwind tokens and animation keyframes
│   └── main.tsx                      # Application entry point
├── index.html                        # HTML entry point with favicon and viewport metadata
├── package.json                      # Project metadata, dependencies, and build scripts
├── tsconfig.json                     # TypeScript compiler configuration
└── vite.config.ts                    # Vite build configuration
```

---

## Getting Started

### Prerequisites

- A current LTS version of **Node.js** (Node.js 18.x, 20.x, or 22.x recommended).
- **npm** (bundled with Node.js) or a compatible package manager (`pnpm` / `yarn`).

Verify your environment:

```bash
node -v
npm -v
```

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Ramanuj080/ChangeGuard.git
cd ChangeGuard
npm install
```

### Running the Development Server

Start the local Vite development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## Usage Walkthrough

1. **Launch ChangeGuard**: Start the development server and open the application in your browser.
2. **Navigate to Upload**: Click **Upload & Analyze Project** from the landing page or **Upload** from the navigation bar.
3. **Select or Upload a Project**:
   - Drag and drop any `.zip` codebase archive.
   - Alternatively, click one of the preloaded sample buttons: **ShopSphere ZIP**, **FinCore ZIP**, or **FleetFlow ZIP**.
4. **Inspect the Architecture Graph**: Navigate to **Architecture** to view the generated multi-layer layout across the 6 architectural tiers.
5. **Inspect Relationship Evidence**: Click on any edge line in the graph to open the relationship panel, revealing the detected source file, code evidence snippet, and confidence rating.
6. **Simulate a Change**: Navigate to **Analyze**. Select the target component and choose the change category.
7. **Provide Change Details**:
   - Enter a text description of the planned modification.
   - Optionally provide a unified Git diff in the **Diff View** tab or upload a `.diff`/`.patch` file.
   - Alternatively, use the **Load High-Risk Sample** or **Load Low-Risk Sample** presets.
8. **Execute Simulation**: Click **Run Impact Simulation**.
9. **Review Blast Radius**: Examine the **Results** dashboard to view the calculated risk level, directly impacted callers, indirect dependencies, and datastore interactions.
10. **Review Test Plan**: Inspect the generated test checklist outlining contract, integration, and regression test requirements.
11. **Export Documentation**: Click **Export Analysis** to download results as JSON, Markdown, or PDF.

---

## Included Sample Projects

ChangeGuard bundles three synthetic microservice projects in `public/` for evaluation and testing:

1. **ShopSphere (`shopsphere-detailed.zip`)**:
   - **Domain**: E-commerce architecture.
   - **Components**: Web Frontend, API Gateway, Order Service, Payment Service, Fraud Service, Inventory Service, Notification Worker, Analytics Service, PostgreSQL, Redis, Analytics Warehouse, and Docker infrastructure.
   - **Key Pattern**: Multi-service convergence on PostgreSQL and downstream fan-out to workers and analytics.

2. **FinCore (`fincore-detailed.zip`)**:
   - **Domain**: Financial banking platform.
   - **Components**: Web Client, Mobile App, API Gateway, Transfer Service, Account Service, Risk Service, Ledger Service, Notification Worker, Event Bus, PostgreSQL, Redis, SMS Provider, and Email Provider.
   - **Key Pattern**: High-consequence financial ledger flows and multi-consumer event bus publishing.

3. **FleetFlow (`fleetflow-detailed.zip`)**:
   - **Domain**: Logistics and dispatch platform.
   - **Components**: Web Tracking Dashboard, API Gateway, Tracking Service, Routing Service, ETA Service, Pricing Service, Maps Service, Dispatch Worker, Notification Worker, Event Bus, PostgreSQL, Warehouse DB, Carrier Provider, Warehouse Provider, and Fuel API.
   - **Key Pattern**: Multi-tier dependency chains, third-party provider integrations, and event-driven dispatch workers.

> **Note**: These projects are synthetic sample archives created specifically to test parser accuracy and graph layout capabilities. They do not represent production systems.

---

## Development and Scripts

Available `npm` scripts defined in `package.json`:

```bash
# Start the local development server with Hot Module Replacement
npm run dev

# Run static type checking with the TypeScript compiler (no emission)
npx tsc --noEmit

# Compile TypeScript and build the optimized production client bundle
npm run build

# Preview the local production build
npm run preview

# Run the Oxlint linter on source files
npm run lint
```

---

## Limitations

To maintain engineering transparency, the following technical limitations apply to the current implementation:

- **Static Heuristics vs. AST**: The scanner relies on regular expressions and pattern matching across source files and configuration manifests rather than full Abstract Syntax Tree (AST) compilation. Syntactically unconventional or heavily metaprogrammed imports may be missed.
- **No Dynamic Dependency Discovery**: Dependencies instantiated via runtime reflection, dynamic service registries (e.g., Consul/Eureka at runtime), or dynamic string interpolation cannot be identified solely from static inspection.
- **Estimated Risk Scores**: The risk score is a deterministic heuristic calculation based on topology, keywords, and detected connections. It provides prioritization guidance, not a guarantee of software safety or defect prevention.
- **Incomplete Language Coverage**: Deep dependency extraction is optimized for TypeScript, JavaScript, Python, Java, Docker Compose, and Kubernetes definitions. Other languages and bespoke build tools may yield lower detection confidence.
- **Memory Limits for Large Archives**: Because ZIP decompression and parsing occur in the browser runtime, exceptionally large archives (exceeding browser memory limits or thousands of files) may encounter performance degradation.

---

## Planned Roadmap

The following capabilities are considered potential areas for future development:

- **Version Control Integrations**: Direct GitHub and GitLab repository integration via REST/GraphQL APIs without manual ZIP downloads.
- **CI/CD Automation**: A headless CLI runner capable of evaluating pull request diffs during CI pipelines and enforcing risk thresholds.
- **Formal AST Parsing**: Language Server Protocol (LSP) or Tree-sitter integration for deeper abstract syntax tree inspection.
- **OpenTelemetry Ingestion**: Blending static dependency graphs with runtime distributed tracing data (Jaeger / OpenTelemetry).
- **Persistent Backend Option**: Optional server-backed database for team collaboration and long-term project change history.

---

## Contributing

Contributions to ChangeGuard are welcome. To propose changes:

1. Fork the repository on GitHub: [https://github.com/Ramanuj080/ChangeGuard](https://github.com/Ramanuj080/ChangeGuard).
2. Create a feature branch (`git checkout -b feature/your-feature-name`).
3. Implement your changes, adhering to existing code conventions and component patterns.
4. Verify that TypeScript compilation and the production build pass cleanly:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
5. Commit your changes with descriptive commit messages (`git commit -m "Add support for OpenAPI 3.1 route detection"`).
6. Push to your branch (`git push origin feature/your-feature-name`).
7. Open a Pull Request detailing the changes and verification steps.

---



<div align="center">
  <sub>ChangeGuard — Pre-Deployment Software Change Impact Analysis</sub>
</div>
