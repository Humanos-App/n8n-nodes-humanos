import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosListResources implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos: List Resources",
    name: "humanosListResources",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description:
      "GET /v1/resource - Retrieve resources (documents, forms, consents, products)",
    defaults: { name: "List Resources" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "humanosApi", required: true }],
    properties: [
      {
        displayName: "Page Index",
        name: "pageIndex",
        type: "number",
        default: 0,
        description: "Page number (0-indexed)",
      },
      {
        displayName: "Page Size",
        name: "pageSize",
        type: "number",
        default: 20,
        description: "Number of items per page (5-100)",
        typeOptions: {
          minValue: 5,
          maxValue: 100,
        },
      },
      {
        displayName: "Search",
        name: "search",
        type: "string",
        default: "",
        description: "Search by resource name",
      },
      {
        displayName: "Active Only",
        name: "active",
        type: "boolean",
        default: true,
        description: "Filter by active status",
      },
      {
        displayName: "Resource Types",
        name: "types",
        type: "multiOptions",
        options: [
          { name: "Consent", value: "CONSENT" },
          { name: "Form", value: "FORM" },
          { name: "Document", value: "DOCUMENT" },
          { name: "Product", value: "PRODUCT" },
        ],
        default: [],
        description: "Filter by resource types",
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

    const pageIndex = this.getNodeParameter("pageIndex", 0) as number;
    const pageSize = this.getNodeParameter("pageSize", 0) as number;
    const search = this.getNodeParameter("search", 0) as string;
    const active = this.getNodeParameter("active", 0) as boolean;
    const types = this.getNodeParameter("types", 0) as string[];

    const qs: Record<string, any> = {
      pageIndex,
      pageSize,
    };

    if (search) qs.search = search;
    if (active !== undefined) qs.active = active;
    if (types && types.length > 0) qs.types = types.join(",");

    const path = "/resource";
    const url = `${baseUrl}${path}`;

    const timestamp = Date.now();
    const body = "";

    // Generate signature: empty body means sign only timestamp (no dot)
    const signature = generateSignature(body, signatureSecret, timestamp);

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

    // Response has structure: { data: [...], totalPages: number }
    return [this.helpers.returnJsonArray(res.data || [])];
  }
}
