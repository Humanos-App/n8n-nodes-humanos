import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosViaResolveDid implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos: VIA Resolve DID",
    name: "humanosViaResolveDid",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description:
      "GET /v1/via/dids/{did} - Resolve a DID to its DID Document with verification methods and keys",
    defaults: { name: "VIA Resolve DID" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "humanosApi", required: true }],
    properties: [
      {
        displayName: "DID",
        name: "did",
        type: "string",
        default: "",
        description:
          "The Decentralized Identifier to resolve (e.g., did:key:z6Mk... or did:via:humanos:...)",
        required: true,
        placeholder: "did:via:humanos:user-123",
      },
      {
        displayName: "Timeout (ms)",
        name: "timeout",
        type: "number",
        default: 0,
        description: "Optional timeout in milliseconds for DID resolution (0 = no timeout)",
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

    const did = this.getNodeParameter("did", 0) as string;
    const timeout = this.getNodeParameter("timeout", 0) as number;

    const qs: Record<string, any> = {};
    if (timeout > 0) qs.timeout = timeout;

    // URL-encode the DID since it contains colons
    const encodedDid = encodeURIComponent(did);
    const path = `/via/dids/${encodedDid}`;
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
