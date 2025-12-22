import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosDownloadResource implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos: Download Resource",
    name: "humanosDownloadResource",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description:
      "GET /v1/resource/download/{id} - Download credential document as PDF",
    defaults: { name: "Download Resource" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "humanosApi", required: true }],
    properties: [
      {
        displayName: "Credential ID",
        name: "credentialId",
        type: "string",
        default: "",
        description:
          "Unique identifier of the credential to download. " +
          "Get this from 'Get Request Detail' → credentials[0].id. " +
          "⚠️ IMPORTANT: The credential must have status 'COMPLETED' or 'ISSUED' to download. " +
          "Credentials with status 'PENDING' cannot be downloaded yet.",
        required: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions) {
    const credentials = (await this.getCredentials("humanosApi")) as any;
    const { apiKey, signatureSecret } = credentials;
    const baseUrl =
      credentials.baseUrl === "__custom__"
        ? credentials.customBaseUrl
        : credentials.baseUrl;

    const credentialId = this.getNodeParameter("credentialId", 0) as string;

    const path = `/resource/download/${credentialId}`;
    const url = `${baseUrl}${path}`;
    const timestamp = Date.now();
    const body = "";

    const signature = generateSignature(body, signatureSecret, timestamp);

    try {
      const res = await this.helpers.httpRequest({
        method: "GET",
        url,
        json: true,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Signature": signature,
          "X-Timestamp": timestamp.toString(),
        },
      });

      // Response: { fileContent: "base64...", internalId: "..." }
      return [this.helpers.returnJsonArray([res])];
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Humanos API error: ${error.response.status} ${error.response.statusText}. ` +
          `URL: ${url}. ` +
          `Response: ${JSON.stringify(error.response.data)}`
        );
      }
      throw error;
    }
  }
}
