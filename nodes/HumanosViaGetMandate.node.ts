import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosViaGetMandate implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos: VIA Get Mandate",
    name: "humanosViaGetMandate",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description:
      "GET /v1/via/mandates/{mandateId} - Retrieve mandate details including scope, constraints, and authorized agents",
    defaults: { name: "VIA Get Mandate" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "humanosApi", required: true }],
    properties: [
      {
        displayName: "Mandate ID",
        name: "mandateId",
        type: "string",
        default: "",
        description: "Unique identifier of the mandate (format: mdt_<uuid>)",
        required: true,
        placeholder: "mdt_abc123xyz",
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

    const mandateId = this.getNodeParameter("mandateId", 0) as string;

    const path = `/via/mandates/${mandateId}`;
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
