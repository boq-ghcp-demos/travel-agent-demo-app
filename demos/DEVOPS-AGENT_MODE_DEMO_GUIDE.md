
# GitHub Copilot–Driven DevOps Showcase  
**Azure App Service, Azure DevOps, Kubernetes (AKS)** — *No manual coding, only clear instructions to Copilot*

This playbook shows how to leverage **GitHub Copilot and Copilot Chat (GHCP)** as your DevOps assistant to generate infrastructure-as-code, CI/CD pipelines, and Kubernetes deployment assets **from scratch**, by simply giving Copilot clear instructions.  

We will work from your ideas in `my-ideas.txt`:

```Text
We have a sample app https://github.com/boq-ghcp-demos/travel-agent-demo-app and want to deploy to different environments using Azure devops and Azure cloud.

1. I want to deploy it in App Service, first show case provisioning the infra using Bicep.
2. Creating a CI/CD pipeline in ADO with different stages like DevTest, PreProd and Prod.
3. Consider deploying into Kubernetes, how do we create manifests, helm charts to support that deployment. 

```
<br>

**Outcomes**

By the end of this demo, using Copilot prompts only, you will:

- Provision Azure App Service infra via Bicep with environment-specific parameters.
- Generate a multi-stage Azure DevOps pipeline (DevTest → PreProd → Prod) with approvals and secrets integration.
- Create Kubernetes manifests/Helm chart for AKS with environment overlays/values.



 **Prerequisites**

- GitHub Copilot and Copilot Chat enabled in VS Code.
- Access to the sample app repo: https://github.com/boq-ghcp-demos/travel-agent-demo-app
- Azure subscription with rights to create resources.
- Azure CLI installed and authenticated:
    `az login`

- Azure DevOps (ADO) org & project, permissions to create:

1. Service connections to Azure.
2. Pipelines, variable groups, environments, approvals.


- Optional: Access to or ability to provision AKS (Azure Kubernetes Service).


**Regional note:** Use an Azure region close to you (e.g., australiasoutheast) for lower latency.

<br/>
<br/>

**Create a demo folder and seed your ideas:**

1. Create **ghcp-devops-demo** folder
2. Create **my-ideas.txt** file inside **ghcp-devops-demo** containing your ideas

## Idea 1 — Provision Azure App Service via Bicep
**Goal:** Generate Bicep templates and parameters to provision App Service (and supporting resources). No manual code — only instruct Copilot.

### Talk to the Agent — Prompt

**Prompt**
Generate a Bicep template for an Azure App Service with Linux runtime. 

