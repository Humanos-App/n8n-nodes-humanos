import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosCancelRequest implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos: Cancel Request",
    name: "humanosCancelRequest",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description: "DELETE /v1/request/{requestId} - Cancel a credential request",
    defaults: { name: "Cancel Request" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "humanosApi", required: true }],
    properties: [
      {
        displayName: "Request ID",
        name: "requestId",
        type: "string",
        default: "",
        description: "Unique identifier of the credential request to cancel",
        required: true,
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

    const path = `/request/${requestId}`;
    const url = `${baseUrl}${path}`;
    const timestamp = Date.now();
    const body = "";

    const signature = generateSignature(body, signatureSecret, timestamp);

    const res = await this.helpers.httpRequest({
      method: "DELETE",
      url,
      json: true,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Signature": signature,
        "X-Timestamp": timestamp.toString(),
      },
    });

    return [this.helpers.returnJsonArray([{ success: res, requestId }])];
  }
}
