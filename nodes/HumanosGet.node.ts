import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosGet implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos GET",
    name: "humanosGet",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description: "Perform a GET request to Humanos API",
    defaults: { name: "Humanos GET" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "humanosApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Endpoint",
        name: "endpoint",
        type: "string",
        default: "/kyc/status",
        description: "API endpoint path (e.g. /kyc/status)",
      },
      {
        displayName: "Query Parameters",
        name: "query",
        type: "json",
        default: "{}",
        description: "Optional query parameters as JSON",
      },
    ],
  };

  async execute(this: IExecuteFunctions) {
    const endpoint = this.getNodeParameter("endpoint", 0) as string;
    const query = this.getNodeParameter("query", 0, {}) as Record<string, any>;
    const credentials = (await this.getCredentials("humanosApi")) as any;
    const { apiKey, signatureSecret } = credentials;
    const baseUrl =
      credentials.baseUrl === "__custom__"
        ? credentials.customBaseUrl
        : credentials.baseUrl;

    const timestamp = Date.now();
    const body = "";
    const signature = generateSignature(body, signatureSecret, timestamp);

    const response = await this.helpers.httpRequest({
      method: "GET",
      url: `${baseUrl}${endpoint}`,
      qs: query,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Signature": signature,
        "X-Timestamp": timestamp.toString(),
      },
      json: true,
    });

    return [this.helpers.returnJsonArray(response)];
  }
}
