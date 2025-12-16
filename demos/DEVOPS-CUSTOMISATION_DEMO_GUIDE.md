# DevOps & Cloud Customisation Demo Guide — *Travel Agent App*

> **Purpose.** This guide refactors and polishes your **`DEVOPS-CUSTOMISATION_DEMO_GUIDE.md`** to focus on practical DevOps and Cloud workflows you can demonstrate end‑to‑end with the Travel Agent application. It leans on GitHub Copilot patterns and demos while mapping them to CI/CD, IaC, security, and cloud deployment scenarios.

---

## Table of Contents

1. [What You’ll Demo](#what-youll-demo)
2. [Prerequisites](#prerequisites)
3. [Reference Application & Architecture](#reference-application--architecture)
4. [Environment Setup](#environment-setup)
5. [Copilot for DevOps: Customisation Patterns](#copilot-for-devops-customisation-patterns)
6. [CI/CD with GitHub Actions](#cicd-with-github-actions)
7. [Infrastructure as Code (IaC)](#infrastructure-as-code-iac)
8. [Cloud Deployment Targets](#cloud-deployment-targets)
9. [DevSecOps & Governance](#devsecops--governance)
10. [Observability & Ops Readiness](#observability--ops-readiness)
11. [Demo Script (10–15 minutes)](#demo-script-1015-minutes)
12. [Prompts & Snippets Appendix](#prompts--snippets-appendix)
13. [References](#references)

---

## What You’ll Demo

A cohesive DevOps walkthrough, using Copilot to:
- Generate and refine pipeline YAML, IaC templates, and deployment manifests.
- Containerise the app and ship it through a secure CI/CD to Azure.
- Instrument the app, enforce security scans, and apply branch protection.
- Use Copilot’s chat/inline/agent features to accelerate changes safely.

---

## Prerequisites

- **GitHub repository** with the Travel Agent app source code.
- **GitHub Actions** enabled (Permissions: Read & Write for workflows).
- **Cloud subscription** (Azure recommended) with Owner/Contributor rights to a resource group.
- **Secrets** (set in repo → *Settings* → *Secrets and variables* → *Actions*):
  - `AZURE_CREDENTIALS` (JSON from `az ad sp create-for-rbac`)
  - `REGISTRY_LOGIN_SERVER`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD` (if using ACR)
  - Optional: `APPINSIGHTS_CONNECTION_STRING`, `COSMOSDB_CONNECTION_STRING`
- **Branch protection** on `main` (require PR + reviews + status checks).

---

## Reference Application & Architecture

### App Overview
Use a modern **Next.js** Travel Agent app as your demo workload—trip search, bookings, guides, points, and a service layer pattern (TypeScript).

### Agent Scenario Variant (Optional)
If you want to show an *agentic* scenario in parallel (e.g., bot/assistant with images/docs and Cosmos DB conversation state), you can draw from the **Azure AI Agents travel assistant** sample architecture (Bot Framework → Assistant Runtime → Cosmos DB).

---

## Environment Setup

1. **Fork/clone** the Travel Agent repo into your GitHub org.
2. Create an **Azure resource group**:
   ```bash
   az group create -n rg-travel-agent-demo -l australiaeast
   ```
3. Provision **Azure Container Registry (ACR)** and **Azure Web App for Containers** or **Azure Container Apps** (see IaC section).
4. In GitHub, add **Actions secrets** (see prerequisites).
5. Enable **GitHub Advanced Security** (optional, enterprise) to run CodeQL and secret scanning.

---

## Copilot for DevOps: Customisation Patterns

> Copilot modes you’ll use: **Chat**, **Inline**, **Edit**, and **Agent**; plus aliases and slash commands to accelerate pipeline and IaC authoring.

### Recommended Prompt Patterns
- **Pipeline authoring**  
  *“In `.github/workflows/ci.yml`, create a Node.js workflow for Next.js: cache, lint, test (Jest), build, and upload an artifact. Add a matrix for `node-version: [18, 20]` and restrict runs to PRs against `main`.”*
- **IaC generation**  
  *“Produce Bicep to deploy ACR and Web App for Containers, parameterise naming, and output connection details. Add role assignment for the GitHub Actions service principal.”*
- **Containerisation & deploy**  
  *“Write an Actions job to build/push Docker image to ACR and deploy to Web App. Include OIDC‑based federated identity to Azure.”*
- **Quality & security**  
  *“Add CodeQL workflow for JavaScript/TypeScript; enforce status checks on PRs; suggest Dependabot config for npm.”*

---

## CI/CD with GitHub Actions

### CI Workflow (Node.js + Next.js)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [ "main" ]
  push:
    branches: [ "main" ]

jobs:
  build-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --ci --reporters=default --reporters=jest-junit
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: nextjs-build
          path: .next
```

### Container Build & Push (ACR)

Add `.github/workflows/cd.yml`:

```yaml
name: CD

on:
  workflow_dispatch:
  push:
    branches: [ "main" ]

permissions:
  id-token: write
  contents: read

env:
  IMAGE_NAME: travel-agent
  REGISTRY: ${{ secrets.REGISTRY_LOGIN_SERVER }}

jobs:
  build-push-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Azure Login (OIDC)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Build image
        run: docker build -t $REGISTRY/$IMAGE_NAME:${{ github.sha }} .

      - name: ACR Login
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login $REGISTRY             -u ${{ secrets.REGISTRY_USERNAME }} --password-stdin

      - name: Push image
        run: docker push $REGISTRY/$IMAGE_NAME:${{ github.sha }}

      - name: Deploy to Web App for Containers
        uses: azure/webapps-deploy@v3
        with:
          app-name: "webapp-travel-agent"
          images: $REGISTRY/$IMAGE_NAME:${{ github.sha }}
```

---

## Infrastructure as Code (IaC)

### Bicep — ACR + Web App for Containers

Create `infra/main.bicep`:

```bicep
param location string = 'australiaeast'
param namePrefix string = 'travelagent'

var acrName = '${namePrefix}acr'
var appName = '${namePrefix}webapp'

resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' existing = {
  name: 'rg-travel-agent-demo'
}

resource acr 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: true
  }
}

resource plan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${namePrefix}-plan'
  location: location
  sku: { name: 'P1v3', tier: 'PremiumV3', capacity: 1 }
}

resource web 'Microsoft.Web/sites@2022-03-01' = {
  name: appName
  location: location
  properties: {
    serverFarmId: plan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${acr.properties.loginServer}/travel-agent:latest'
      appSettings: [
        { name: 'DOCKER_REGISTRY_SERVER_URL', value: 'https://${acr.properties.loginServer}' }
        { name: 'DOCKER_REGISTRY_SERVER_USERNAME', value: acr.listCredentials().username }
        { name: 'DOCKER_REGISTRY_SERVER_PASSWORD', value: acr.listCredentials().passwords[0].value }
      ]
    }
    httpsOnly: true
  }
}

output registryLoginServer string = acr.properties.loginServer
output webAppName string = web.name
```

---

## Cloud Deployment Targets

- **Azure Web App for Containers**: Simple PaaS for containerised Next.js.  
- **Azure Container Apps / AKS**: For more complex agent flows or scaling strategies.  
- **Cosmos DB & App Insights**: Persistence and telemetry for agent dialogs and app behaviour.

---

## DevSecOps & Governance

1. **CodeQL** security scans on PRs:
   ```yaml
   name: CodeQL
   on:
     pull_request:
       branches: [ "main" ]
   jobs:
     analyze:
       uses: github/codeql-action/analyze@v3
   ```
2. **Dependabot** for npm and GitHub Actions updates:
   ```yaml
   version: 2
   updates:
     - package-ecosystem: "npm"
       directory: "/"
       schedule: { interval: "weekly" }
     - package-ecosystem: "github-actions"
       directory: "/"
       schedule: { interval: "weekly" }
   ```
3. **Branch protection**: Require PR, signed commits (optional), status checks (CI, CodeQL), and reviewers.  
4. **Secret scanning**: Enable repository-level secret scanning (enterprise).  
5. **Copilot guardrails**: Use custom instructions to keep prompts focused on infra and security best practices.

---

## Observability & Ops Readiness

- **Application Insights**: Add connection string to app settings; use Next.js logging adapters.  
- **Dashboards/Alerts**: Configure alerts on 5xx rate, latency, CPU/memory for container apps.  
- **Release annotations**: Use Actions to annotate deployments for trace correlation.  
- **Cosmos DB** (agent variant): Monitor RU consumption and set autoscale limits.

---

## Demo Script (10–15 minutes)

**0:00–2:00 — Setup & Intent**  
- Open repo; show `package.json`, `lib/services`, tests, and Dockerfile.  
- Outline the goal: CI → container → deploy → observability.

**2:00–6:00 — Copilot Accelerates Authoring**  
- In VS Code, ask Copilot to scaffold `ci.yml` (lint/test/build + artifacts).  
- Use inline chat to fix test flakiness or ESLint rules.

**6:00–9:00 — IaC & Cloud Resources**  
- Generate Bicep for ACR + Web App; deploy with `az deployment group create`.  
- Push image via `cd.yml` job; show OIDC login step.

**9:00–12:00 — Security & Quality Gates**  
- Enable CodeQL; open a PR; show status checks gating `main`.  
- Add Dependabot config; demonstrate suggested PR updates.

**12:00–15:00 — Observability & (Optional) Agent Variant**  
- Inject App Insights connection string; browse live logs/metrics.  
- If showing agentic sample, reference Bot + Assistant + Cosmos pattern.

---

## Prompts & Snippets Appendix

### Copilot Prompts
- *“Refactor `TripService.searchTrips` to support pagination and cursor‑based filtering; generate tests that mock data in `lib/data/mockData.ts`.”*
- *“Write a production‑ready Dockerfile for Next.js with multi‑stage build, non‑root user, and healthcheck.”*
- *“Produce an Actions workflow to build and push to ACR using OIDC, then deploy to Web App (Linux). Add environment gates and manual approval.”*

### Next.js Production Dockerfile (example)

```dockerfile
# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /src/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /src/.next ./.next
COPY --from=build /src/public ./public
COPY --from=build /src/next.config.js ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "require('http').request({host:'127.0.0.1',port:3000,path:'/'},r=>process.exit(r.statusCode>=200&&r.statusCode<500?0:1)).on('error',()=>process.exit(1)).end()"
CMD ["npm","start"]
```

---

## References

- **Travel Agent Demo App (Next.js, TypeScript)** — repo overview and structure.
- **Azure AI Agents Travel Assistant** — Bot Framework + Assistant Runtime + Cosmos DB architecture.
- **GitHub Copilot Lab** — modes (Chat/Inline/Edit/Agent), aliases, slash commands, and best‑practice prompting.

---

## Attribution & Notes

- This guide is tailored to DevOps and Cloud customisation, blending Copilot workflows with CI/CD, IaC, and secure deployments. It references public demos and labs for reproducible patterns.
- Replace placeholders (resource names, secrets, regions) with your environment specifics before running.
