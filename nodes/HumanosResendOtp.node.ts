import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosResendOtp implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos: Resend OTP",
    name: "humanosResendOtp",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description:
      "PATCH /v1/request/resend/{requestId} - Resend OTP to a subject for credential approval",
    defaults: { name: "Resend OTP" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "humanosApi", required: true }],
    properties: [
      {
        displayName: "Request ID",
        name: "requestId",
        type: "string",
        default: "",
        description: "Unique identifier of the credential request",
        required: true,
      },
      {
        displayName: "Lookup By",
        name: "lookupBy",
        type: "options",
        options: [
          { name: "Contact", value: "contact" },
          { name: "Contact DID", value: "did" },
          { name: "Internal ID", value: "internalId" },
        ],
        default: "contact",
        required: true,
        description: "How to identify the subject to resend OTP to (exactly one required)",
      },
      {
        displayName: "Contact",
        name: "contact",
        type: "string",
        default: "",
        description: "Email or phone number of the subject",
        required: true,
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
        description: "DID associated with the subject contact (e.g., did:via:humanos:user-123)",
        required: true,
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

    const requestId = this.getNodeParameter("requestId", 0) as string;
    const lookupBy = this.getNodeParameter("lookupBy", 0) as string;

    const qs: Record<string, string> = {};
    if (lookupBy === "contact") {
      qs.contact = this.getNodeParameter("contact", 0) as string;
    } else if (lookupBy === "did") {
      qs.did = this.getNodeParameter("did", 0) as string;
    } else if (lookupBy === "internalId") {
      qs.internalId = this.getNodeParameter("internalId", 0) as string;
    }

    const path = `/request/resend/${requestId}`;
    const url = `${baseUrl}${path}`;
    const timestamp = Date.now();
    const body = "";

    const signature = generateSignature(body, signatureSecret, timestamp);

    try {
      const res = await this.helpers.httpRequest({
        method: "PATCH",
        url,
        qs,
        json: true,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Signature": signature,
          "X-Timestamp": timestamp.toString(),
        },
      });

      return [this.helpers.returnJsonArray([{ success: res, requestId }])];
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
