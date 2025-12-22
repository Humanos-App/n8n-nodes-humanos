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
        description: "Array of credential objects",
        displayOptions: {
          show: {
            resourceType: ["credentials"],
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

    const contactsInput = this.getNodeParameter("contacts", 0) as string;
    const securityLevel = this.getNodeParameter("securityLevel", 0) as string;
    const resourceType = this.getNodeParameter("resourceType", 0) as string;

    const contacts = contactsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    const bodyObj: any = {
      contacts,
      securityLevel,
    };

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
      throw new Error(`Failed to create request: ${error.message}`);
    }
  }
}
