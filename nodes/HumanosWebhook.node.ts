import {
  IHookFunctions,
  IWebhookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData,
  IDataObject,
} from "n8n-workflow";
import { generateSignature } from "../utils/signature";

export class HumanosWebhook implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Humanos Webhook",
    name: "humanosWebhook",
    icon: "file:humanos.png",
    group: ["trigger"],
    version: 1,
    description:
      "Listens to Humanos webhook events with automatic webhook registration",
    defaults: {
      name: "Humanos Webhook",
    },
    inputs: [],
    outputs: ["main"],
    credentials: [
      {
        name: "humanosApi",
        required: true,
      },
    ],
    webhooks: [
      {
        name: "default",
        httpMethod: "POST",
        responseMode: "onReceived",
        path: "webhook",
      },
    ],
    properties: [
      {
        displayName: "Auto Register",
        name: "autoRegister",
        type: "boolean",
        default: false,
        description:
          "Whether to automatically register/unregister this webhook with the Humanos API",
      },
      {
        displayName: "Webhook Name",
        name: "webhookName",
        type: "string",
        default: "n8n Webhook",
        description: "Name for this webhook in Humanos dashboard",
        displayOptions: {
          show: {
            autoRegister: [true],
          },
        },
      },
      {
        displayName: "Events",
        name: "events",
        type: "multiOptions",
        options: [
          {
            name: "KYC Completed",
            value: "process.kyc.completed",
          },
          {
            name: "User Signature Completed",
            value: "process.signature.user.completed",
          },
          {
            name: "Professional Signature Completed",
            value: "process.signature.professional.completed",
          },
          {
            name: "Consent Completed",
            value: "process.consent.completed",
          },
          {
            name: "Form Filled",
            value: "process.form.filled",
          },
          {
            name: "Form Rejected",
            value: "process.form.rejected",
          },
          {
            name: "Process Completed",
            value: "process.completed",
          },
        ],
        default: ["process.kyc.completed"],
        description: "The events to listen for",
        displayOptions: {
          show: {
            autoRegister: [true],
          },
        },
      },
      {
        displayName: "Event Filter",
        name: "eventFilter",
        type: "options",
        options: [
          {
            name: "All Events",
            value: "*",
            description: "Trigger on any webhook event",
          },
          {
            name: "KYC Completed",
            value: "process.kyc.completed",
          },
          {
            name: "User Signature Completed",
            value: "process.signature.user.completed",
          },
          {
            name: "Professional Signature Completed",
            value: "process.signature.professional.completed",
          },
          {
            name: "Consent Completed",
            value: "process.consent.completed",
          },
          {
            name: "Form Filled",
            value: "process.form.filled",
          },
          {
            name: "Form Rejected",
            value: "process.form.rejected",
          },
          {
            name: "Process Completed",
            value: "process.completed",
          },
        ],
        default: "*",
        description: "Filter events received (only for manual registration)",
        displayOptions: {
          show: {
            autoRegister: [false],
          },
        },
      },
    ],
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        const autoRegister = this.getNodeParameter("autoRegister") as boolean;

        if (!autoRegister) {
          // Manual registration mode - always return true
          return true;
        }

        try {
          const webhookUrl = this.getNodeWebhookUrl("default");
          const credentials = await this.getCredentials("humanosApi");

          // If credentials are not available, assume webhook doesn't exist
          if (!credentials || !credentials.apiKey || !credentials.baseUrl) {
            return false;
          }

          const { apiKey, signatureSecret } = credentials;
          const baseUrl =
            credentials.baseUrl === "__custom__"
              ? credentials.customBaseUrl
              : credentials.baseUrl;

          // Check if webhook exists by listing all webhooks
          const timestamp = Date.now();
          const body = "";
          const signature = generateSignature(
            body,
            signatureSecret as string,
            timestamp
          );

          const webhooks = await this.helpers.httpRequest({
            method: "GET",
            url: `${baseUrl}/webhooks`,
            json: true,
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "x-signature": signature,
              "x-timestamp": timestamp.toString(),
            },
          });

          // Check if our webhook URL exists
          if (Array.isArray(webhooks)) {
            return webhooks.some((webhook: any) => webhook.url === webhookUrl);
          }
          return false;
        } catch (error) {
          // If endpoint doesn't exist or fails, assume webhook doesn't exist
          return false;
        }
      },

      async create(this: IHookFunctions): Promise<boolean> {
        const autoRegister = this.getNodeParameter("autoRegister") as boolean;

        if (!autoRegister) {
          // Manual registration mode - nothing to create
          return true;
        }

        try {
          const webhookUrl = this.getNodeWebhookUrl("default");
          const webhookName = this.getNodeParameter("webhookName") as string;
          const events = this.getNodeParameter("events") as string[];
          const credentials = await this.getCredentials("humanosApi");

          // If credentials are not available, return true (manual mode)
          if (!credentials || !credentials.apiKey || !credentials.baseUrl) {
            return true;
          }

          const { apiKey, signatureSecret } = credentials;
          const baseUrl =
            credentials.baseUrl === "__custom__"
              ? credentials.customBaseUrl
              : credentials.baseUrl;

          const timestamp = Date.now();
          const body = JSON.stringify({
            name: webhookName,
            url: webhookUrl,
            events,
            active: true,
          });

          const signature = generateSignature(
            body,
            signatureSecret as string,
            timestamp
          );

          const response = await this.helpers.httpRequest({
            method: "POST",
            url: `${baseUrl}/webhooks`,
            body,
            json: true,
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "X-Signature": signature,
              "X-Timestamp": timestamp.toString(),
              "Content-Type": "application/json",
            },
          });

          // Store webhook ID for later deletion
          if (response.id) {
            const webhookData = this.getWorkflowStaticData("node");
            webhookData.webhookId = response.id;
          }

          return true;
        } catch (error: any) {
          throw new Error(`Failed to register webhook: ${error.message}`);
        }
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const autoRegister = this.getNodeParameter("autoRegister") as boolean;

        if (!autoRegister) {
          // Manual registration mode - nothing to delete
          return true;
        }

        const webhookData = this.getWorkflowStaticData("node");
        const webhookId = webhookData.webhookId as string;

        if (!webhookId) {
          return true;
        }

        try {
          const credentials = await this.getCredentials("humanosApi");
          const { apiKey, signatureSecret } = credentials;
          const baseUrl =
            credentials.baseUrl === "__custom__"
              ? credentials.customBaseUrl
              : credentials.baseUrl;

          const timestamp = Date.now();
          const body = "";
          const signature = generateSignature(
            body,
            signatureSecret as string,
            timestamp
          );

          await this.helpers.httpRequest({
            method: "DELETE",
            url: `${baseUrl}/webhooks/${webhookId}`,
            json: true,
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "X-Signature": signature,
              "X-Timestamp": timestamp.toString(),
            },
          });

          // Clear stored webhook ID
          delete webhookData.webhookId;
          return true;
        } catch (error: any) {
          // Don't fail if webhook is already deleted
          return true;
        }
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const bodyData = this.getBodyData();
    const autoRegister = this.getNodeParameter("autoRegister") as boolean;

    // Event filtering for manual registration mode
    if (!autoRegister) {
      const eventFilter = this.getNodeParameter("eventFilter") as string;

      // Safely check for event type in bodyData
      let eventType = null;
      if (bodyData && typeof bodyData === "object") {
        eventType = (bodyData as any).event || (bodyData as any).type;
      }

      if (eventFilter !== "*" && eventType && eventType !== eventFilter) {
        // Event doesn't match filter, don't trigger workflow
        return {
          noWebhookResponse: true,
        };
      }
    }

    // Ensure bodyData is valid before processing
    const processedData = bodyData || {};

    // Return the webhook data to trigger the workflow
    return {
      workflowData: [
        this.helpers.returnJsonArray(processedData as IDataObject),
      ],
    };
  }
}
