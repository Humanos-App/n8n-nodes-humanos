import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosViaGetMandateVc implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos: VIA Get Mandate VC",
    name: "humanosViaGetMandateVc",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description:
      "GET /v1/via/mandates/{mandateId}/vc - Retrieve mandate as a W3C Verifiable Credential",
    defaults: { name: "VIA Get Mandate VC" },
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
      {
        displayName: "VC Version",
        name: "version",
        type: "options",
        options: [
          { name: "W3C VC 2.0 (Default)", value: "2.0" },
          { name: "W3C VC 1.1", value: "1.1" },
        ],
        default: "2.0",
        description: "W3C Verifiable Credential spec version to use",
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
    const version = this.getNodeParameter("version", 0) as string;

    const qs: Record<string, any> = {};
    if (version && version !== "2.0") qs.version = version;

    const path = `/via/mandates/${mandateId}/vc`;
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
