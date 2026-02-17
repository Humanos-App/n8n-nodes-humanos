import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosGetUser implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos: Get User",
    name: "humanosGetUser",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description:
      "GET /v1/user - Retrieve user information by contact, DID, or internal ID",
    defaults: { name: "Get User" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "humanosApi", required: true }],
    properties: [
      {
        displayName: "Lookup By",
        name: "lookupBy",
        type: "options",
        options: [
          { name: "Contact (Email/Phone)", value: "contact" },
          { name: "Contact DID", value: "did" },
          { name: "Internal ID", value: "internalId" },
        ],
        default: "contact",
        required: true,
        description: "How to search for the user (exactly one required)",
      },
      {
        displayName: "Contact",
        name: "contact",
        type: "string",
        default: "",
        description: "Email address or phone number of the user",
        required: true,
        placeholder: "user@example.com",
        displayOptions: {
          show: {
            lookupBy: ["contact"],
          },
        },
      },
      {
        displayName: "Contact DID",
        name: "did",
        type: "string",
        default: "",
        description: "DID associated with the user contact (e.g., did:via:humanos:user-abc123)",
        required: true,
        placeholder: "did:via:humanos:user-abc123",
        displayOptions: {
          show: {
            lookupBy: ["did"],
          },
        },
      },
      {
        displayName: "Internal ID",
        name: "internalId",
        type: "string",
        default: "",
        description: "Internal ID assigned by the organization",
        required: true,
        placeholder: "internal-user-12345",
        displayOptions: {
          show: {
            lookupBy: ["internalId"],
          },
        },
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

    const lookupBy = this.getNodeParameter("lookupBy", 0) as string;

    const qs: Record<string, string> = {};
    if (lookupBy === "contact") {
      qs.contact = this.getNodeParameter("contact", 0) as string;
    } else if (lookupBy === "did") {
      qs.did = this.getNodeParameter("did", 0) as string;
    } else if (lookupBy === "internalId") {
      qs.internalId = this.getNodeParameter("internalId", 0) as string;
    }

    const path = "/user";
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
