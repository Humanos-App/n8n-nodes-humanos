import { ICredentialType, INodeProperties } from "n8n-workflow";

export class HumanosApi implements ICredentialType {
  name = "humanosApi";
  displayName = "Humanos API";
  documentationUrl = "https://humanos.mintlify.app";
  properties: INodeProperties[] = [
    {
      displayName: "API Base URL",
      name: "baseUrl",
      type: "options",
      options: [{ name: "Production", value: "https://api.humanos.id/v1" }],
      default: "https://api.humanos.id/v1",
      description: "Select API environment",
    },
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      default: "",
      typeOptions: { password: true },
      description: "Bearer API key",
    },
    {
      displayName: "Signature Secret",
      name: "signatureSecret",
      type: "string",
      default: "",
      typeOptions: { password: true },
      description: "Secret used to compute X-Signature (HMAC-SHA256).",
    },
  ];
}
