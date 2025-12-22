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
      "PATCH /v1/request/resend/{subjectOtpId} - Resend OTP to a subject",
    defaults: { name: "Resend OTP" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "humanosApi", required: true }],
    properties: [
      {
        displayName: "Subject OTP ID",
        name: "subjectOtpId",
        type: "string",
        default: "",
        description: "Unique identifier of the SubjectOTP record",
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

    const subjectOtpId = this.getNodeParameter("subjectOtpId", 0) as string;

    const path = `/request/resend/${subjectOtpId}`;
    const url = `${baseUrl}${path}`;
    const timestamp = Date.now();
    const body = "";

    const signature = generateSignature(body, signatureSecret, timestamp);

    try {
      const res = await this.helpers.httpRequest({
        method: "PATCH",
        url,
        json: true,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Signature": signature,
          "X-Timestamp": timestamp.toString(),
        },
      });

      return [this.helpers.returnJsonArray([{ success: res, subjectOtpId }])];
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
