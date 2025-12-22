import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosListRequests implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos: List Requests",
    name: "humanosListRequests",
    icon: "file:humanos.png",
    group: ["transform"],
    version: 1,
    description: "GET /v1/request - Retrieve credential requests",
    defaults: { name: "List Requests" },
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
        description: "Search by request name",
      },
      {
        displayName: "Active Only",
        name: "active",
        type: "boolean",
        default: true,
        description: "Filter by active status",
      },
      {
        displayName: "Subject ID",
        name: "subjectId",
        type: "string",
        default: "",
        description: "Filter by subject (user) ID",
      },
      {
        displayName: "Agent ID",
        name: "agentId",
        type: "string",
        default: "",
        description: "Filter by agent ID",
      },
      {
        displayName: "Security Level",
        name: "securityLevel",
        type: "multiOptions",
        options: [
          { name: "Contact", value: "CONTACT" },
          { name: "Organization KYC", value: "ORGANIZATION_KYC" },
          { name: "Humanos KYC", value: "HUMANOS_KYC" },
          { name: "Humanos Revalidation", value: "HUMANOS_REVALIDATION" },
        ],
        default: [],
        description: "Filter by security level",
      },
      {
        displayName: "Date From",
        name: "dateFrom",
        type: "dateTime",
        default: "",
        description: "Start date filter",
      },
      {
        displayName: "Date To",
        name: "dateTo",
        type: "dateTime",
        default: "",
        description: "End date filter",
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
    const subjectId = this.getNodeParameter("subjectId", 0) as string;
    const agentId = this.getNodeParameter("agentId", 0) as string;
    const securityLevel = this.getNodeParameter("securityLevel", 0) as string[];
    const dateFrom = this.getNodeParameter("dateFrom", 0) as string;
    const dateTo = this.getNodeParameter("dateTo", 0) as string;

    const qs: Record<string, any> = {
      pageIndex,
      pageSize,
    };

    if (search) qs.search = search;
    if (active !== undefined) qs.active = active;
    if (subjectId) qs.subjectId = subjectId;
    if (agentId) qs.agentId = agentId;
    if (securityLevel && securityLevel.length > 0)
      qs.securityLevel = securityLevel;
    if (dateFrom) qs.dateFrom = dateFrom;
    if (dateTo) qs.dateTo = dateTo;

    const path = "/request";
    const url = `${baseUrl}${path}`;

    // For GET requests, body is empty string
    const body = "";
    const timestamp = Date.now();

    // Generate signature: empty body means sign only timestamp (no dot)
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

      // Response has structure: { data: [...], totalCount: number, pageIndex: number, pageSize: number }
      // Always return something, even if empty
      let dataArray: any[] = [];

      if (res && res.data && Array.isArray(res.data)) {
        dataArray = res.data;
      } else if (Array.isArray(res)) {
        dataArray = res;
      } else if (res) {
        // Return full response as single item if it's not an array
        dataArray = [res];
      }

      // If still empty, return a metadata object so user knows the call succeeded
      if (dataArray.length === 0) {
        dataArray = [
          {
            message: "No requests found",
            totalCount: res?.totalCount || 0,
            pageIndex: pageIndex,
            pageSize: pageSize,
            apiResponse: res,
          },
        ];
      }

      return [this.helpers.returnJsonArray(dataArray)];
    } catch (error: any) {
      // Make sure errors are always visible
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
