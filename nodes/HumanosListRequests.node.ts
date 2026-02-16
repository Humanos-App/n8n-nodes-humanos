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
        description: "Search by request name (case-insensitive partial match)",
      },
      {
        displayName: "Subject DID",
        name: "subjectDid",
        type: "string",
        default: "",
        description: "Filter requests by subject DID (e.g., did:via:humanos:user-123)",
      },
      {
        displayName: "Subject Contact",
        name: "subjectContact",
        type: "string",
        default: "",
        description: "Filter requests by subject contact (email or phone)",
      },
      {
        displayName: "Subject Internal ID",
        name: "subjectInternalId",
        type: "string",
        default: "",
        description: "Filter requests by subject internal ID",
      },
      {
        displayName: "Agent DID",
        name: "agentDid",
        type: "string",
        default: "",
        description: "Filter by agent DID (e.g., did:via:humanos:agent-123)",
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
        description: "Start date filter (will be converted to start of day)",
      },
      {
        displayName: "Date To",
        name: "dateTo",
        type: "dateTime",
        default: "",
        description: "End date filter (will be converted to end of day, requires Date From)",
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
    const subjectDid = this.getNodeParameter("subjectDid", 0) as string;
    const subjectContact = this.getNodeParameter("subjectContact", 0) as string;
    const subjectInternalId = this.getNodeParameter("subjectInternalId", 0) as string;
    const agentDid = this.getNodeParameter("agentDid", 0) as string;
    const securityLevel = this.getNodeParameter("securityLevel", 0) as string[];
    const dateFrom = this.getNodeParameter("dateFrom", 0) as string;
    const dateTo = this.getNodeParameter("dateTo", 0) as string;

    const qs: Record<string, any> = {
      pageIndex,
      pageSize,
    };

    if (search) qs.search = search;
    if (subjectDid) qs.subjectDid = subjectDid;
    if (subjectContact) qs.subjectContact = subjectContact;
    if (subjectInternalId) qs.subjectInternalId = subjectInternalId;
    if (agentDid) qs.agentDid = agentDid;
    if (securityLevel && securityLevel.length > 0)
      qs.securityLevel = securityLevel;
    if (dateFrom) qs.dateFrom = dateFrom;
    if (dateTo) qs.dateTo = dateTo;

    const path = "/request";
    const url = `${baseUrl}${path}`;

    const body = "";
    const timestamp = Date.now();

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

      let dataArray: any[] = [];

      if (res && res.data && Array.isArray(res.data)) {
        dataArray = res.data;
      } else if (Array.isArray(res)) {
        dataArray = res;
      } else if (res) {
        dataArray = [res];
      }

      if (dataArray.length === 0) {
        dataArray = [
          {
            message: "No requests found",
            totalPages: res?.totalPages || 0,
            pageIndex: pageIndex,
            pageSize: pageSize,
            apiResponse: res,
          },
        ];
      }

      return [this.helpers.returnJsonArray(dataArray)];
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
