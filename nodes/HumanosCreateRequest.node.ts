import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosCreateRequest implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos: Create Request",
    name: "humanosCreateRequest",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description: "POST /v1/request - Create credential request",
    defaults: { name: "Create Request" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "humanosApi", required: true }],
    properties: [
      {
        displayName: "Request Name",
        name: "name",
        type: "string",
        default: "",
        description: "Name to be assigned to the request",
      },
      {
        displayName: "Contacts",
        name: "contacts",
        type: "string",
        default: "",
        required: true,
        description:
          "Comma-separated emails or phone numbers (e.g., user@example.com, +351912345678)",
        placeholder: "user@example.com, +351912345678",
      },
      {
        displayName: "Security Level",
        name: "securityLevel",
        type: "options",
        options: [
          { name: "Contact", value: "CONTACT" },
          { name: "Organization KYC", value: "ORGANIZATION_KYC" },
          { name: "Humanos KYC", value: "HUMANOS_KYC" },
          { name: "Humanos Revalidation", value: "HUMANOS_REVALIDATION" },
        ],
        default: "CONTACT",
        required: true,
        description: "Security level for this request",
      },
      {
        displayName: "Resource Type",
        name: "resourceType",
        type: "options",
        options: [
          { name: "Group IDs", value: "groupIds" },
          { name: "Resource IDs", value: "resourcesIds" },
          { name: "Inline Credentials", value: "credentials" },
        ],
        default: "resourcesIds",
        description: "How to specify resources",
      },
      {
        displayName: "Group IDs",
        name: "groupIds",
        type: "string",
        default: "",
        description: "Comma-separated group IDs",
        displayOptions: {
          show: {
            resourceType: ["groupIds"],
          },
        },
      },
      {
        displayName: "Resource IDs",
        name: "resourcesIds",
        type: "string",
        default: "",
        description: "Comma-separated resource IDs",
        displayOptions: {
          show: {
            resourceType: ["resourcesIds"],
          },
        },
      },
      {
        displayName: "Credentials JSON",
        name: "credentials",
        type: "json",
        default: "[]",
        description: "Array of credential objects with scope, type, name, and data fields",
        displayOptions: {
          show: {
            resourceType: ["credentials"],
          },
        },
      },
      {
        displayName: "Allow Duplicates",
        name: "allowDuplicates",
        type: "boolean",
        default: false,
        description: "Whether to allow duplicate credential requests for the same contacts",
      },
      {
        displayName: "Language",
        name: "language",
        type: "string",
        default: "",
        description: "Language code for the request (e.g., ENG, PRT)",
      },
      {
        displayName: "Signature Placements JSON",
        name: "signaturePlacements",
        type: "json",
        default: "[]",
        description:
          "Array of signature placement objects for PDF documents. Each object: { resourceId, contact, x (0-100%), y (0-100%), width (0-100%), height (0-100%), pageIndex (0-based) }",
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

    const name = this.getNodeParameter("name", 0) as string;
    const contactsInput = this.getNodeParameter("contacts", 0) as string;
    const securityLevel = this.getNodeParameter("securityLevel", 0) as string;
    const resourceType = this.getNodeParameter("resourceType", 0) as string;
    const allowDuplicates = this.getNodeParameter("allowDuplicates", 0) as boolean;
    const language = this.getNodeParameter("language", 0) as string;
    const signaturePlacementsInput = this.getNodeParameter("signaturePlacements", 0) as string;

    const contacts = contactsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    const bodyObj: any = {
      contacts,
      securityLevel,
    };

    if (name) bodyObj.name = name;
    if (allowDuplicates) bodyObj.allowDuplicates = allowDuplicates;
    if (language) bodyObj.language = language;

    // Add resources based on type
    if (resourceType === "groupIds") {
      const groupIdsInput = this.getNodeParameter("groupIds", 0) as string;
      if (groupIdsInput) {
        bodyObj.groupIds = groupIdsInput
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }
    } else if (resourceType === "resourcesIds") {
      const resourcesIdsInput = this.getNodeParameter(
        "resourcesIds",
        0
      ) as string;
      if (resourcesIdsInput) {
        bodyObj.resourcesIds = resourcesIdsInput
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }
    } else if (resourceType === "credentials") {
      const credentialsInput = this.getNodeParameter(
        "credentials",
        0
      ) as string;
      try {
        bodyObj.credentials = JSON.parse(credentialsInput);
      } catch (error) {
        throw new Error("Invalid JSON in credentials field");
      }
    }

    // Add signature placements if provided
    if (signaturePlacementsInput) {
      try {
        const placements = JSON.parse(signaturePlacementsInput);
        if (Array.isArray(placements) && placements.length > 0) {
          bodyObj.signaturePlacements = placements;
        }
      } catch (error) {
        throw new Error("Invalid JSON in signature placements field");
      }
    }

    const body = JSON.stringify(bodyObj);
    const path = "/request";
    const url = `${baseUrl}${path}`;
    const timestamp = Date.now();

    const signature = generateSignature(body, signatureSecret, timestamp);

    try {
      const res = await this.helpers.httpRequest({
        method: "POST",
        url,
        body,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Signature": signature,
          "X-Timestamp": timestamp.toString(),
          "Content-Type": "application/json",
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
