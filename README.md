# Claude Bridge Appwrite Function

This Appwrite Cloud Function bridges super.appwrite.network to local Claude Code sessions, enabling remote development from anywhere.

## 🚀 Auto-Deployment

This function automatically deploys to Appwrite when you push to the main branch.

### Setup GitHub Secrets

1. Go to your GitHub repository settings
2. Navigate to **Settings > Secrets and variables > Actions**
3. Add a new repository secret:
   - Name: `APPWRITE_API_KEY`
   - Value: Your Appwrite API key with function deployment permissions

### Getting an Appwrite API Key

1. Go to [Appwrite Console](https://cloud.appwrite.io/console/project-68a4e3da0022f3e129d0/settings/api-keys)
2. Create a new API key with these scopes:
   - `functions.read`
   - `functions.write`
   - `executions.read`
   - `executions.write`
3. Copy the API key and add it as a GitHub secret

## 📝 Function Endpoints

- `POST /claude` - Forward prompts to local Claude Code
- `GET /status` - Health check
- `GET /sessions` - View session history

## 🔗 Function URL

Once deployed, your function will be available at:
```
https://68a4e3da0022f3e129d0.appwrite.global/functions/v1/claude-bridge
```

## 🏗️ Architecture

```
super.appwrite.network (anywhere)
    ↓ HTTPS
Appwrite Cloud Function (this repo)
    ↓ HTTP
localhost:8767 (Bridge Server)
    ↓ stdin/stdout
claunch (Claude Code)
    ↓
Local development environment
```

## 🚦 Local Bridge Server

Make sure your local bridge server is running:
```bash
node claude-bridge-server.js
```

## 📦 Manual Deployment

If you prefer manual deployment:
```bash
npm install -g appwrite-cli
appwrite login
appwrite functions createDeployment \
  --functionId=claude-bridge \
  --entrypoint=main.js \
  --code=. \
  --activate=true
```

## 🔧 Configuration

The function expects these environment variables in Appwrite:
- `APPWRITE_API_KEY` - For database operations (optional)

## 📊 Testing

Test the function:
```bash
curl https://68a4e3da0022f3e129d0.appwrite.global/functions/v1/claude-bridge/status
```# Trigger deployment
