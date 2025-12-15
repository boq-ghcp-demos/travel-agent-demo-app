
# DEVOPS - AGENT MODE DEMO

We have a sample web app in "https://github.com/boq-ghcp-demos/travel-agent-demo-app" and want to do a simple deployment to Azure App Service.

## PART 1 - Provisioning the infrastructure using Bicep


Please generate a Bicep template that creates:
- A resource group 
- An App Service Plan (Linux)
- Check the Repo to find out the specific tech stack used for this app
- Pick East US region and S1 tier Web Application


  
## PART 2 - Creating a CI/CD pipeline in ADO with different stages such as DEV, PREPROD and PROD

### Step 1 — Scaffold multi-stage pipeline
Create an Azure DevOps multi-stage YAML pipeline for this Node.js app that:
- Builds and tests the app
- Deploys to Azure App Service in three environments: DEV, PREPROD, PROD
- Uses an Azure Resource Manager service connection < Service Connection Name >
- Publishes build output in the simplest way you think is best
- Configures manual approval before PROD
Save the pipeline as azure-pipelines.yml at the repo root.



Create an Azure DevOps multi-stage YAML pipeline for this Node.js app that:
- Builds the app
- Deploys to Azure App Service in three environments: DEV, PREPROD, PROD
- Uses an Azure Resource Manager service connection (you choose and reference the name)
- Follows Azure naming rules, derives from the repo name and Chooses sensible environment-specific names NOW and writes them into the YAML for:
  • App Service (web app) names for DEV, PREPROD, PROD
  • Resource groups for DEV, PREPROD, PROD
- Publishes build output using the simplest and most reliable approach for multi-stage deployment and update the pipeline accordingly
- Configures manual approval before the PROD stage via Azure DevOps Environments.
Save the pipeline as `azure-pipelines.yml` at the repo root and show the FULL YAML with the names you selected.

