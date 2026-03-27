import { env } from "../env.js";
import { getCharacterEmailConfig } from "../db.js";

interface EmailParams {
  character_id: string;
  visitor_message: string;
  conversation_summary: string;
  visitor_name: string;
  visitor_email: string;
}

export async function emailCompany(params: EmailParams) {
  const {
    character_id,
    visitor_message,
    conversation_summary,
    visitor_name,
    visitor_email,
  } = params;

  const config = await getCharacterEmailConfig(character_id);

  const combinedContent = `Visitor's message:\n${visitor_message}\n\nConversation summary:\n${conversation_summary}`;

  const mailBody = {
    from: {
      name: "Hallway",
      email: "notifications@joinhallway.com",
    },
    to: [{ email: config.companyEmail }],
    bcc: ["email-notification-pipecat@joinhallway.com", "bryan@joinhallway.com"]
      .filter((e) => e.toLowerCase() !== config.companyEmail.toLowerCase())
      .map((e) => ({ email: e })),
    subject: `Conversation with ${visitor_name} about ${config.companyName}`,
    template_id: "pq3enl6y8z7g2vwr",
    personalization: [
      {
        email: config.companyEmail,
        data: {
          visitor_name,
          visitor_email,
          company_name: config.companyName,
          character_name: config.personaName,
          conversation_summary: combinedContent,
        },
      },
    ],
  };

  const response = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MAILERSEND_API_KEY}`,
    },
    body: JSON.stringify(mailBody),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MailerSend error ${response.status}: ${text}`);
  }

  return {
    content: [
      {
        type: "text",
        text: `Email sent to ${config.companyEmail} about conversation with ${visitor_name}.`,
      },
    ],
  };
}

export const emailCompanyToolDefinition = {
  name: "email_company",
  title: "Email Company",
  description:
    "Send an email to the company on behalf of a visitor. Before calling this tool you MUST ask the visitor for: (1) their name, (2) their email address, and (3) what they want the email to say. Never guess or infer any of these — ask and wait for the visitor to respond.",
  inputSchema: {
    type: "object",
    properties: {
      character_id: {
        type: "string",
        description: "The character ID (auto-injected, do not set manually)",
      },
      visitor_message: {
        type: "string",
        description:
          "What the visitor wants to say in the email, as described by them. Ask the visitor what they want to communicate before calling this tool.",
      },
      conversation_summary: {
        type: "string",
        description:
          "A brief recap of the conversation for context (topics discussed, questions asked, etc.).",
      },
      visitor_name: {
        type: "string",
        description: "The visitor's name as explicitly stated by them",
      },
      visitor_email: {
        type: "string",
        description:
          "The visitor's email address as explicitly provided by them. NEVER guess or fabricate this value.",
      },
    },
    required: [
      "character_id",
      "visitor_message",
      "conversation_summary",
      "visitor_name",
      "visitor_email",
    ],
  },
};
