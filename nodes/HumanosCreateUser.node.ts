import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosCreateUser implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos: Create User",
    name: "humanosCreateUser",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description: "POST /v1/user - Import users into Humanos",
    defaults: { name: "Create User" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "humanosApi", required: true }],
    properties: [
      {
        displayName: "Users JSON",
        name: "users",
        type: "json",
        default: '[{"contact": "user@example.com"}]',
        required: true,
        description: "Array of user objects (minimum 1, maximum 100)",
        placeholder:
          '[{"contact": "user@example.com", "internalId": "123", "identity": {...}}]',
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

    const usersInput = this.getNodeParameter("users", 0) as string;

    let users;
    try {
      users = JSON.parse(usersInput);
    } catch (error) {
      throw new Error("Invalid JSON in users field");
    }

    if (!Array.isArray(users)) {
      throw new Error("Users must be an array");
    }

    if (users.length < 1 || users.length > 100) {
      throw new Error("Must provide between 1 and 100 users");
    }

    const body = JSON.stringify(users);
    const path = "/user";
    const url = `${baseUrl}${path}`;
    const timestamp = Date.now();

    const signature = generateSignature(body, signatureSecret, timestamp);

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

    // Response is array of feedback objects
    return [this.helpers.returnJsonArray(res)];
  }
}
