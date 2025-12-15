
# DEVOPS - AGENT MODE DEMO

We have a sample web app at "https://github.com/boq-ghcp-demos/travel-agent-demo-app" and want to do a simple deployment to Azure App Service.

**Note:** Make sure you have got enough quota in this region. Alternatively choose the region where you have required quota.
 
## PART 1 - Provisioning the infrastructure for DEV, PREPROD and PROD environments using Bicep

**PROMPT:**
Please generate a Bicep template that creates infrastructure in Azure for a wweb app located at "https://github.com/boq-ghcp-demos/travel-agent-demo-app":
- 3 resource groups:  <br/>
  rg-travel-agent-demo-dev   <br/>
  rg-travel-agent-demo-preprod   <br/>
  rg-travel-agent-demo-prod   <br/>
- An App Service Plan in each RG (Linux) by removing "rg-" from the RG name.
- Check the GitHub Repo provided to find out the specific tech stack used for this app.
- Pick East US region and S1 tier Web Application.

 
## PART 2 - Creating a CI/CD pipeline in ADO with different stages of DEV, PREPROD and PROD

### Step 1 — Scaffold multi-stage pipeline

**Pre-requisits:**

1- Create a Service Connection in Azure Devops - [Visit here for instructions](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints?view=azure-devops)

2- Grant permissions via Azure Portal <br/>
**Note:** The service principal can't grant itself permissions.  <br/>
You can grant the `Contributor` permission manually:
- Go to Azure Portal → Resource Group `rg-travel-agent-demo-dev`
- Click Access control (IAM) → Add role assignment
- Select  Contributor role
- Click Next → Select User, group, or service principal
- Search for your service principal ( name or the ID)
- Click Review + assign
- repeat for `rg-travel-agent-demo-preprod` and `rg-travel-agent-demo-prod`
<br/>
or via azure CLI: 
<br/>

```
# Get the service principal object ID and Subscription ID
$spObjectId = "<Service Connector ID>"
$subsId = "<Subscription ID>"

# Grant Contributor role to DEV
az role assignment create --assignee-object-id $spObjectId --assignee-principal-type ServicePrincipal --role "Contributor" --scope "/subscriptions/$subsId/resourceGroups/rg-travel-agent-demo-dev"

# Grant Contributor role to PREPROD
az role assignment create --assignee-object-id $spObjectId --assignee-principal-type ServicePrincipal --role "Contributor" --scope "/subscriptions/$subsId/resourceGroups/rg-travel-agent-demo-preprod"

# Grant Contributor role to PROD
az role assignment create --assignee-object-id $spObjectId --assignee-principal-type ServicePrincipal --role "Contributor" --scope "/subscriptions/$subsId/resourceGroups/rg-travel-agent-demo-prod"

````

### Step 2 - GHCP Pprompt
<br/>
Create an Azure DevOps multi-stage YAML pipeline for this Node.js app that:

- Uses an Azure Resource Manager service connection (you choose and reference the name).
- Deploys the web app located in "https://github.com/boq-ghcp-demos/travel-agent-demo-app" to Azure App Service all the three environments (DEV, PREPROD and PROD).
- Clone the app repo to get the required packages for npm install.
- Publishes build output using the most reliable approach for multi-stage deployment and update the pipeline accordingly
- Configures manual approval before the PROD stage via Azure DevOps Environments.
- Checks the GitHub Repo provided to find out the specific tech stack used for this app and grab required files from this repo. <br/>

Save the pipeline as `azure-pipelines.yml` at the repo root and show the FULL YAML with the names you selected.

### Step 3 - Create a ADO pipeline with YAML, upload `azure-pipelines.yml` and run the pipeline.

- Pipelines → New pipeline → GitHub → pick repo → YAML → select azure-pipelines.yml.
- Authorize GitHub and the ARM service connection when prompted (OAuth). [learn.microsoft.com] 
- Create environments dev, preprod, prod; add an approval check to prod. [learn.microsoft.com]
- Run: Build → Deploy DEV → Deploy PREPROD → Approve → Deploy PROD.
<br/>

## PART 3 - Deploying into Kubernetes


