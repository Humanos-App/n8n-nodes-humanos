# n8n-nodes-humanos

![Humanos](humanos.png)

This is an n8n community node package for integrating with the [Humanos](https://humanos.id) API. It provides nodes for KYC verification, identity management, credential requests, and webhook handling.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### npm

```bash
npm install n8n-nodes-humanos
```

### In n8n

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-humanos` and click **Install**

## Nodes

This package includes the following nodes:

| Node | Description |
|------|-------------|
| **Humanos: List Requests** | Retrieve credential requests with filtering and pagination |
| **Humanos: Create Request** | Create a new credential request for users |
| **Humanos: Get Request Detail** | Get detailed information about a specific request |
| **Humanos: Cancel Request** | Cancel an existing credential request |
| **Humanos: Resend OTP** | Resend OTP verification to a user |
| **Humanos: List Resources** | List available resources (documents, forms, consents) |
| **Humanos: List Resource Groups** | List resource groups |
| **Humanos: Download Resource** | Download a completed credential as PDF |
| **Humanos: Create User** | Import users into Humanos |
| **Humanos GET** | Perform custom GET requests to the Humanos API |
| **Humanos Webhook** | Trigger workflows on Humanos events (KYC completed, signature completed, etc.) |

## Credentials

To use these nodes, you need to configure the **Humanos API** credentials:

| Field | Description |
|-------|-------------|
| **API Base URL** | Select environment (Development/Production) or enter a custom URL |
| **API Key** | Your Humanos API key (Bearer token) |
| **Signature Secret** | Secret key for HMAC-SHA256 request signing |

### Getting Your API Credentials

1. Log in to your [Humanos Dashboard](https://dashboard.humanos.id)
2. Navigate to **Settings > API Keys**
3. Create a new API key and note the signature secret

## Webhook Events

The Humanos Webhook node can listen for the following events:

- `process.kyc.completed` - KYC verification completed
- `process.signature.user.completed` - User signature completed
- `process.signature.professional.completed` - Professional signature completed
- `process.consent.completed` - Consent form completed
- `process.form.filled` - Form submission completed
- `process.form.rejected` - Form submission rejected
- `process.completed` - Entire process completed

## API Documentation

For detailed API documentation, visit:
- [Humanos API Documentation](https://documenter.getpostman.com/view/47566781/2sB3HevPTe)

## Development

### Building

```bash
npm install
npm run build
```

### Local Testing

Link the package to your local n8n installation:

```bash
npm link
cd ~/.n8n/custom
npm link n8n-nodes-humanos
```

Then restart n8n to load the nodes.

## License

[MIT](LICENSE)

## Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Humanos Website](https://humanos.id)
- [Humanos API Documentation](https://documenter.getpostman.com/view/47566781/2sB3HevPTe)
