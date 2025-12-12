
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
- Validate deployments and apply best practices — all without writing the code yourself.
