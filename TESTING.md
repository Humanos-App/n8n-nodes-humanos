# Local Testing Guide

## Prerequisites

- Node.js >= 18
- n8n installed globally (`npm install -g n8n`)

## Quick Start

### 1. Build the nodes

```bash
npm install
npm run build
```

### 2. Link to n8n

```bash
# Create custom folder if it doesn't exist
mkdir -p ~/.n8n/custom

# Link the package
npm link
cd ~/.n8n/custom
npm link @humanos-ai/n8n-nodes-humanos
```

### 3. Start n8n

```bash
n8n start
```

Open http://localhost:5678 in your browser.

## Development Workflow

For active development with auto-rebuild:

**Terminal 1 - Watch for changes:**
```bash
npm run dev
```

**Terminal 2 - Run n8n:**
```bash
n8n start
```

After making changes, restart n8n to load the updated nodes.

## Alternative: Using Environment Variable

Instead of linking, you can point n8n directly to your build:

```bash
# Build first
npm run build

# Run n8n with custom nodes path
N8N_CUSTOM_EXTENSIONS="/Users/snakeuser/Documents/work/humanos/code/n8n-nodes-humanos" n8n start
```

## Testing Your Nodes

1. Open n8n at http://localhost:5678
2. Create a new workflow
3. Search for "Humanos" in the nodes panel
4. Add credentials:
   - Go to **Credentials** > **New**
   - Select **Humanos API**
   - Fill in your API Key and Signature Secret
5. Test the node by executing the workflow

## Troubleshooting

**Nodes not appearing:**
- Ensure `npm run build` completed without errors
- Check the `dist/` folder exists with compiled files
- Restart n8n after linking

**Credential errors:**
- Verify your API key is correct
- Check the base URL matches your environment (dev/prod)

**Changes not reflecting:**
- Rebuild with `npm run build`
- Restart n8n (it caches node definitions)
