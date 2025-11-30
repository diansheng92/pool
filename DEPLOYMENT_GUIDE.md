# Azure Deployment Guide

## Option 1: Azure Portal (Easiest - No CLI needed)

### Step 1: Create Azure SQL Database
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → Search "SQL Database"
3. Fill in:
   - Resource Group: Create new `pool-rg`
   - Database name: `pooldb`
   - Server: Create new
     - Server name: `yourpoolsqlsrv123` (must be unique globally)
     - Admin login: `sqladmin`
     - Password: Create strong password
     - Location: East US
   - Compute + storage: Basic or Standard S0
4. Click "Review + create" → Create
5. After creation, go to server → Networking:
   - Allow Azure services: Yes
   - Add your client IP

### Step 2: Create App Service
1. Click "Create a resource" → "Web App"
2. Fill in:
   - Resource Group: `pool-rg` (same as above)
   - Name: `pool-web-app-12345` (must be unique globally)
   - Publish: Code
   - Runtime stack: Node 18 LTS
   - Operating System: Linux
   - Region: East US
   - Plan: Basic B1 or higher
3. Click "Review + create" → Create

### Step 3: Configure App Settings
1. Go to your Web App → Configuration → Application settings
2. Add these settings (click "New application setting" for each):
   ```
   PORT = 3000
   JWT_SECRET = your-strong-secret-here-change-this
   AZURE_SQL_SERVER = yourpoolsqlsrv123.database.windows.net
   AZURE_SQL_DATABASE = pooldb
   AZURE_SQL_USER = sqladmin
   AZURE_SQL_PASSWORD = your-sql-password
   AZURE_SQL_ENCRYPT = true
   ```
3. Click "Save"

### Step 4: Deploy Code
1. Go to your Web App → Deployment Center
2. Choose "Local Git" or "GitHub"
3. If GitHub:
   - Connect your GitHub account
   - Select repository: `diansheng92/pool`
   - Branch: `main`
   - Click "Save"
4. If Local Git:
   - Copy the Git URL provided
   - Run locally:
     ```bash
     git remote add azure <your-git-url>
     git push azure main
     ```

### Step 5: Update config.js
1. Note your Web App URL: `https://pool-web-app-12345.azurewebsites.net`
2. Edit `config.js` in your repo:
   ```javascript
   window.API_URL = 'https://pool-web-app-12345.azurewebsites.net';
   ```
3. Commit and push (will auto-deploy if using GitHub)

### Step 6: Test
- Visit: `https://pool-web-app-12345.azurewebsites.net/api/health`
- Visit: `https://pool-web-app-12345.azurewebsites.net/safety-covers-template.html`
- Register, login, submit quote

---

## Option 2: Azure CLI (After installation completes)

Wait for `brew install azure-cli` to finish, then run:

```bash
# Login
az login

# Set variables
RESOURCE_GROUP=pool-rg
LOCATION=eastus
SQL_SERVER_NAME=yourpoolsqlsrv123
SQL_ADMIN_USER=sqladmin
SQL_ADMIN_PASS='VeryStrong!Passw0rd'
SQL_DB_NAME=pooldb
APP_PLAN=pool-app-plan
WEBAPP_NAME=pool-web-app-12345

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create SQL server
az sql server create \
  --name $SQL_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $SQL_ADMIN_USER \
  --admin-password $SQL_ADMIN_PASS

# Configure firewall
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

MY_IP=$(curl -s ifconfig.me)
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name AllowClientIP \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP

# Create database
az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name $SQL_DB_NAME \
  --service-objective S0

# Create App Service plan
az appservice plan create \
  --name $APP_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_PLAN \
  --name $WEBAPP_NAME \
  --runtime "NODE|18-lts"

# Configure app settings
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --settings \
  PORT=3000 \
  JWT_SECRET=replace-with-strong-secret \
  AZURE_SQL_SERVER=$SQL_SERVER_NAME.database.windows.net \
  AZURE_SQL_DATABASE=$SQL_DB_NAME \
  AZURE_SQL_USER=$SQL_ADMIN_USER \
  AZURE_SQL_PASSWORD=$SQL_ADMIN_PASS \
  AZURE_SQL_ENCRYPT=true

# Deploy via zip
zip -r app.zip server-azure.js package.json package-lock.json *.html images config.js migrate-sqlite-to-azure.js
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --src app.zip

# View logs
az webapp log tail --resource-group $RESOURCE_GROUP --name $WEBAPP_NAME
```

---

## Quick Start (Recommended)

**Use Azure Portal (Option 1)** - it's visual, easier, and doesn't require CLI installation to complete.

The entire process takes about 10-15 minutes.
