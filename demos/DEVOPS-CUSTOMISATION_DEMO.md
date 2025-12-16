
# DevOps & Cloud Deployment Guide for `travel-agent-demo-app`

This guide explains how to deploy the sample app to **Azure App Service** and optionally to **Azure Kubernetes Service (AKS)** using **Azure DevOps multi-stage pipelines**.

---

## Table of Contents
1. [Overview](#overview)
2. [Provision App Service with Bicep](#provision-app-service-with-bicep)
3. [Azure DevOps Multi-Stage Pipeline](#azure-devops-multi-stage-pipeline)
4. [Kubernetes Deployment (AKS)](#kubernetes-deployment-aks)
5. [Prompts for GitHub Copilot](#prompts-for-github-copilot)
6. [Supporting Files for Automation](#supporting-files-for-automation)
7. [Appendix: Embedded `.agent.md`](#appendix-embedded-agentmd)
8. [Appendix: Embedded `.instructions.md`](#appendix-embedded-instructionsmd)
9. [Appendix: Embedded `.prompt.md`](#appendix-embedded-promptmd)

---

## Overview
- **App Service Path:** Deploy the Next.js app to Azure App Service (Linux).
- **AKS Path:** Containerize and deploy via Kubernetes manifests or Helm charts.

---

## Provision App Service with Bicep
Create `infra/main.bicep`:

```bicep
param nameSuffix string
param sku string = 'P1v3'
param linuxFxVersion string = 'node|22-lts'
param location string = resourceGroup().location

var planName = 'asp-${nameSuffix}'
var siteName = 'web-${nameSuffix}'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  sku: { name: sku }
  kind: 'linux'
  properties: { reserved: true }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: siteName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      appSettings: [
        { name: 'NEXT_PUBLIC_API_BASE_URL'; value: 'https://api-dev.example.com' }
      ]
    }
    httpsOnly: true
  }
}

output webAppName string = webApp.name
```

Deploy:
```bash
az group create -n rg-travelapp-dev -l australiaeast
az deployment group create \
  --resource-group rg-travelapp-dev \
  --template-file infra/main.bicep \
  --parameters nameSuffix=dev
```

---

## Azure DevOps Multi-Stage Pipeline
Create `.ado/azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include: [ main ]

variables:
  azureSubscription: 'AzureServiceConnection'
  webapp_dev: 'web-dev'
  webapp_preprod: 'web-preprod'
  webapp_prod: 'web-prod'

stages:
- stage: Build
  jobs:
    - job: build
      steps:
        - task: NodeTool@0
          inputs: { versionSpec: '22.x' }
        - script: |
            npm ci
            npm run build
        - task: ArchiveFiles@2
          inputs:
            rootFolderOrFile: '$(Build.SourcesDirectory)'
            archiveFile: '$(Build.ArtifactStagingDirectory)/site.zip'
        - task: PublishBuildArtifacts@1
          inputs:
            pathToPublish: '$(Build.ArtifactStagingDirectory)'
            artifactName: 'drop'

- stage: DevTest
  dependsOn: Build
  jobs:
    - deployment: deploy_dev
      environment: 'DevTest'
      strategy:
        runOnce:
          deploy:
            steps:
              - download: current
                artifact: drop
              - task: AzureWebApp@1
                inputs:
                  azureSubscription: '$(azureSubscription)'
                  appName: '$(webapp_dev)'
                  package: '$(Pipeline.Workspace)/drop/site.zip'

# Repeat similar stages for PreProd and Prod with approvals
```

> **Approvals:** Configure **Approvals & Checks** on ADO Environments `PreProd` and `Prod` to gate releases.

---

## Kubernetes Deployment (AKS)
- Create Helm chart in `charts/travelapp`:

```yaml
# Chart.yaml
apiVersion: v2
name: travelapp
version: 0.1.0
```

- Add templates for Deployment and Service with container port `3000`.
- Use pipeline tasks:

```yaml
- task: Kubernetes@1
  inputs:
    command: 'login'
- task: HelmInstaller@1
- task: HelmDeploy@1
  inputs:
    command: 'upgrade'
    chartPath: 'charts/travelapp'
    releaseName: 'travelapp'
    arguments: '--install --set image.tag=$(Build.BuildNumber)'
```

> Keep environment differences in `values.dev.yaml`, `values.preprod.yaml`, `values.prod.yaml` and pass `-f` per environment.

---

## Prompts for GitHub Copilot

### Overview
Use these prompts with GitHub Copilot (VS Code) to scaffold infra and CI/CD for the travel agent app:
- **Bicep** – App Service (East US, S1)
- **Azure DevOps** – Multi-stage pipeline w/ approvals
- **AKS** – Kubernetes manifests

---

### 1) Bicep – App Service (East US, S1)
**One-shot prompt**  
```
Generate a Bicep file that deploys an App Service Plan (Linux) and a Web App in **eastus** using **S1** tier. Parameters: `webAppName`, `location='eastus'`. Set `httpsOnly=true`. Bind site to the plan via `serverFarmId`. Output the web app hostname. Use `Microsoft.Web/serverfarms` and `Microsoft.Web/sites` latest API versions.
```
**Refinement prompts**
```
- Add `reserved: true`, `kind: 'linux'` for the plan; validate `sku: { name: 'S1', tier: 'Standard' }`. [1](https://learn.microsoft.com/en-us/azure/app-service/provision-resource-bicep)
- Add `siteConfig.linuxFxVersion` as a parameter and comment how to list runtimes (`az webapp list-runtimes`). [3](https://github.com/Azure-Samples/app-service-web-app-best-practice/blob/main/sample.bicep)
```
---

### 2) Azure DevOps – Multi-Stage YAML Pipeline
**One-shot prompt**  
```
Create `azure-pipelines.yml` with stages `Build`, `Dev`, `Staging` (approval gate), optional `Prod`. Use deployment jobs targeting environments named `Dev`, `Staging`, `Prod`. Deploy the artifact to the East US Web App using `AzureWebApp@1`. Variables: `azureSubscription`, `resourceGroup`, `webAppName`. Document that **approvals are set in Environments UI**. [4](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/create-multistage-pipeline?view=azure-devops)[5](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/approvals?view=azure-devops)
```

**Refinement prompts**
```
- Build stage: install, build, test, publish artifact on `ubuntu-latest`. [6](https://mercuryworks.com/blog/creating-a-multi-stage-pipeline-in-azure-devops)
- Dev/Staging/Prod stages: `strategy: runOnce` deployment jobs referencing environments. Add comments on Environments and Approvals. [5](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/approvals?view=azure-devops)
```
---

### 3) AKS – Kubernetes Deployment
**One-shot prompt**
```
Generate `deployment.yaml` and `service.yaml` for a stateless web app: `Deployment` (3 replicas, image `${ACR_LOGIN_SERVER}/myapp:latest`, probes on `/healthz`), `Service` `LoadBalancer` on port 80. Labels/selectors consistent, rolling updates configured. Compatible with `kubectl apply -f`. [8](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
```

**Refinement prompts**
```
- Add resource requests/limits and probe timings; explain how to update `${ACR_LOGIN_SERVER}` from `az acr list`. [7](https://learn.microsoft.com/en-us/azure/aks/tutorial-kubernetes-deploy-application)
```
---

## Supporting Files for Automation
Create these three files in your repo (embedded versions are below if you prefer a single file):

### 1. `.agent.md` – Specialized Assistance Agent
Defines the role and scope of an automation agent for Azure DevOps, Bicep, and AKS/Helm.

### 2. `.instructions.md` – Code Standards & CI/CD Instructions
Defines coding standards, pipeline conventions, and deployment best practices.

### 3. `.prompt.md` – Reusable Prompts
Provides ready-to-use prompts for generating Bicep templates, pipeline YAML, Helm charts, and environment settings.

---

## Appendix: Embedded `.agent.md`

```markdown

---
description: 'The agent is an Azure DevOps Cloud Specialist Agent and helps plan, scaffold, and validate pipelines, IaC, and Kubernetes artifacts for the `travel-agent-demo-app`.'
tools: ['vscode', 'execute', 'read', 'edit', 'search', 'web', 'microsoft.docs.mcp/*', 'agent', 'bicep-(experimental)/*', 'azure-mcp/*', 'todo']
---

## Scope & Capabilities
- Design multi-stage ADO pipelines (Build → DevTest → PreProd → Prod) with **Environments** and **Approvals & Checks**.
- Generate and review **Bicep** modules for App Service (Linux), including runtime config and app settings.
- Scaffold **Helm charts** and **Kubernetes manifests**; validate images, tags, and values overrides per environment.
- Recommend secure configuration (Key Vault integration, secrets handling) and deployment strategies (slots, blue/green, HPA).

## Inputs
- Repository context: Next.js/TypeScript app, Docker support, environment targets.
- Desired environment names, resource group names, app service names, AKS cluster/ACR names.

## Outputs
- Validated YAML pipelines, Bicep templates, Helm charts, and k8s manifests ready to commit.
- Step-by-step commands for provisioning and promotion.

## Guardrails
- Enforce gated releases via ADO **Environments** (PreProd/Prod) and require approvals.
- Enforce App Service deployments through `AzureWebApp@1` or AKS deployments through `Kubernetes@1` + `HelmDeploy@1` tasks.
- Parameterize environment differences via Bicep params and Helm values files.

## References (for the agent to use)
- ADO Multi-stage pipelines & approvals (Microsoft Learn).
- App Service Bicep quickstart and samples (Microsoft Learn).
- AKS pipeline guidance & Helm task reference (Microsoft Learn).
---
```

---

## Appendix: Embedded `.instructions.md`

```markdown
# Code Standards & CI/CD Instructions (.instructions.md)

These instructions define conventions and standards for infrastructure, pipelines, and Kubernetes artifacts.

## General Standards
- **Git**: Branch protection on `main`; PRs required; squash merges; semantic commit messages.
- **Versioning**: Use semantic versions for artifacts and Helm charts; tag Docker images with `$(Build.BuildNumber)` and `git SHA`.
- **Security**: this is a minimal demo app - do not make it complex. 

## BICEP Standards
- **Structure**: `infra/` folder; root `main.bicep` calling parameterized modules.
- **Parameters**: `nameSuffix`, `sku`, `linuxFxVersion`, `location`; environment-specific parameter files (`dev.json`, `preprod.json`, `prod.json`).
- **Outputs**: `webAppName`, `appServicePlanName` to feed pipeline variables.
- **Validation**: run `az bicep build` and `az deployment group what-if` prior to deploy.

## Azure DevOps Pipeline Standards
- **Stages**: `Build`, `DevTest`, `PreProd`, `Prod`.
- **Environments**: Create ADO Environments with **Approvals & Checks** for PreProd/Prod.
- **Tasks**:
  - App Service: `AzureWebApp@1` (ZIP deploy); use `AzureAppServiceSettings@0` for app settings.
  - AKS/Helm: `Kubernetes@1` (login), `HelmInstaller@1`, `HelmDeploy@1` (upgrade --install).
- **Artifacts**: Publish `site.zip` for App Service; package Helm chart if needed.
- **Quality Gates**: Lint, unit tests; optional SAST/Dependency checks.

## Kubernetes/Helm Standards
- **Chart Layout**: `charts/travelapp` with `Chart.yaml`, `values.yaml`, and `templates/` (deployment, service, hpa, ingress).
- **Values**: Maintain `values.dev.yaml`, `values.preprod.yaml`, `values.prod.yaml`; pass via `-f` per stage.
- **Probes**: Readiness and liveness on `/` port 3000.
- **Service**: `LoadBalancer` (or `Ingress` when required); define resource requests/limits.

## Logging & Monitoring
- Enable Application Insights for App Service; Container insights for AKS.

## Rollback & Recovery
- App Service: use deployment slots or redeploy previous artifact.
- AKS: `helm rollback <release> <revision>`.
```

---

## Appendix: Embedded `.prompt.md`

```markdown
# Reusable Prompts (.prompt.md)

## Scaffold App Service Bicep (DevTest)
**Goal**: Generate a parameterized Bicep for App Service (Linux) with Node runtime and app settings.
**Prompt**:
> Create a `infra/main.bicep` that provisions a Linux App Service Plan and Web App using parameters: `nameSuffix`, `sku`, `linuxFxVersion`, `location`. Add app settings for `NEXT_PUBLIC_API_BASE_URL` and `NODE_ENV`, set `httpsOnly=true`. Output `webAppName` and `appServicePlanName`.

## Multi‑Stage ADO Pipeline
**Goal**: Build, archive, and deploy across DevTest → PreProd → Prod with ADO Environments and approvals.
**Prompt**:
> Create `.ado/azure-pipelines.yml` with stages `Build`, `DevTest`, `PreProd`, `Prod`. Use `NodeTool@0` (22.x), `ArchiveFiles@2`, `PublishBuildArtifacts@1`. Deploy with `AzureWebApp@1` to environment‑specific `appName` variables. Target ADO Environments and ensure approvals for PreProd/Prod.

## AKS + Helm Deployment Stage
**Goal**: Add an AKS deployment stage using Helm with image tag set to the build number.
**Prompt**:
> Extend the pipeline with stage `AKS_Deploy`: login to AKS using `Kubernetes@1` (ARM service connection), install Helm via `HelmInstaller@1`, and run `HelmDeploy@1 upgrade --install` on `charts/travelapp` with `--set image.tag=$(Build.BuildNumber)` and environment‑specific `values.*.yaml` overrides.

## Helm Chart Templates
**Goal**: Create a minimal Helm chart for the Next.js app.
**Prompt**:
> Scaffold `charts/travelapp` with `Chart.yaml`, `values.yaml`, and templates for `deployment.yaml` and `service.yaml`. Use container port 3000, set readiness/liveness probes and `service.type=LoadBalancer`.

## Environment Settings via Pipeline
**Goal**: Manage App Service settings from YAML.
**Prompt**:
> Add an `AzureAppServiceSettings@0` step to set `NEXT_PUBLIC_API_BASE_URL` and any required connection strings using pipeline variables or Key Vault references.

## 6Promotion & Approval Policy
**Goal**: Enforce gated releases.
**Prompt**:
> Configure ADO Environments (`DevTest`, `PreProd`, `Prod`) and set **Approvals & Checks** on `PreProd` and `Prod`. Ensure deployment jobs target these environments so approvals are enforced.
```
