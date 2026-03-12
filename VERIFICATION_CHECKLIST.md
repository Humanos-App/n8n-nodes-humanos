# n8n Verification Submission Checklist

This package is prepared for n8n verified community node submission.

## Package identity

- npm package: `@humanos-ai/n8n-nodes-humanos`
- repository: `https://github.com/Humanos-App/n8n-nodes-humanos`
- license: MIT

## Required checks

- [x] Package published to npm
- [x] Includes `n8n-community-node-package` in `keywords`
- [x] `package.json` includes `n8n.credentials` and `n8n.nodes`
- [x] README includes installation, usage, credentials, and API docs
- [x] TypeScript build passes (`npm run build`)
- [x] Type checks pass (`npm run lint`)
- [x] Security scan passes (`npx @n8n/scan-community-package <package-name>`)

## Submit to n8n

1. Sign in at `https://creators.n8n.io/nodes`
2. Submit package name: `@humanos-ai/n8n-nodes-humanos`
3. Provide repository URL: `https://github.com/Humanos-App/n8n-nodes-humanos`
4. Provide npm URL:
   - `https://www.npmjs.com/package/@humanos-ai/n8n-nodes-humanos`
5. Add notes about supported Humanos features:
   - KYC/identity workflows
   - Request and credential operations
   - Webhook-based automation
   - VIA protocol endpoints

## Notes

- n8n may request UI/UX refinements before approval.
- Keep README and npm metadata in sync for future versions.
