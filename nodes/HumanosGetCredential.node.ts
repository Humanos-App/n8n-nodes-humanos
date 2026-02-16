import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosGetCredential implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos: Get Credential",
    name: "humanosGetCredential",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description:
      "GET /v1/credential/{credentialId} - Retrieve a W3C Verifiable Credential with optional PDF",
    defaults: { name: "Get Credential" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "humanosApi", required: true }],
    properties: [
      {
        displayName: "Credential ID",
        name: "credentialId",
        type: "string",
        default: "",
        description: "Unique identifier of the credential (MongoDB ObjectId)",
        required: true,
      },
      {
        displayName: "Include PDF",
        name: "includePdf",
        type: "boolean",
        default: false,
        description:
          "Whether to include the PDF content for document-type credentials (base64 encoded)",
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
    const includePdf = this.getNodeParameter("includePdf", 0) as boolean;

    const qs: Record<string, any> = {};
    if (includePdf) qs.includePdf = true;

    const path = `/credential/${credentialId}`;
    const url = `${baseUrl}${path}`;
    const timestamp = Date.now();
    const body = "";

    const signature = generateSignature(body, signatureSecret, timestamp);

    try {
      const res = await this.helpers.httpRequest({
        method: "GET",
        url,
        qs,
        json: true,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Signature": signature,
          "X-Timestamp": timestamp.toString(),
        },
      });

      return [this.helpers.returnJsonArray([res])];
    } catch (error: any) {
      const errorMessage = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message || JSON.stringify(error);
      throw new Error(
        `Humanos API error (${
          error.response?.status || "unknown"
        }): ${errorMessage}`
      );
    }
  }
}
