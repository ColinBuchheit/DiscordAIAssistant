import { OpenAI } from "openai";
import dotenv from "dotenv";
import winston from "winston";

// Load environment variables
dotenv.config();

// Configure logging
const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} - ${level.toUpperCase()} - ${message}`
    )
  ),
  transports: [new winston.transports.Console()],
});

// Environment variables
const CHATGPT_API_KEY = process.env.CHATGPT_API_KEY;
const ASSISTANT_KEY = process.env.ASSISTANT_KEY;

// Validate essential environment variables
if (!CHATGPT_API_KEY) {
  logger.error("CHATGPT_API_KEY is not set in the environment variables.");
  process.exit(1);
}

if (!ASSISTANT_KEY) {
  logger.error("ASSISTANT_KEY is not set in the environment variables.");
  process.exit(1);
}

// Initialize OpenAI instance
const openai = new OpenAI({ apiKey: CHATGPT_API_KEY });

// Type definitions for assistant message content
interface AssistantMessageContent {
  type: string;
  text?: { value: string };
}

interface AssistantMessage {
  role: string;
  content: string | AssistantMessageContent[];
}

// Helper to extract assistant response content
const extractResponseContent = (assistantMessage: AssistantMessage | undefined): string => {
  if (!assistantMessage) {
    return "No response received.";
  }

  if (Array.isArray(assistantMessage.content)) {
    const responseText = assistantMessage.content
      .map((item: AssistantMessageContent) =>
        item.type === "text" && item.text?.value ? item.text.value : ""
      )
      .join(" ")
      .trim();
    return responseText || "No response received.";
  } else if (typeof assistantMessage.content === "string") {
    return assistantMessage.content;
  }
  return "No response received.";
};

// Helper to poll for run completion
const pollRunStatus = async (threadId: string, runId: string): Promise<string> => {
  let status = "queued";
  while (status === "queued" || status === "in_progress") {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for 500ms
    const updatedRun = await openai.beta.threads.runs.retrieve(threadId, runId);
    status = updatedRun.status;
    logger.debug(`Run Status: ${status}`);
  }
  return status;
};

// Main function to get ChatGPT response
export const chatGPTResponse = async (prompt: string): Promise<string> => {
  try {
    logger.debug(`Using Assistant Key: ${ASSISTANT_KEY}`);
    logger.debug(`User Prompt: ${prompt}`);

    // Step 1: Create a thread
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;
    logger.info(`Thread Created: ${threadId}`);

    // Step 2: Submit the user message
    const message = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: prompt,
    });
    logger.info(`Message Submitted: ${message.id}`);

    // Step 3: Run the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_KEY,
    });
    const runId = run.id;
    logger.info(`Run Created: ${runId}`);

    // Step 4: Poll for completion
    const finalStatus = await pollRunStatus(threadId, runId);
    logger.info(`Run Completed: ${finalStatus}`);

    // Step 5: Retrieve the messages
    const messages = await openai.beta.threads.messages.list(threadId);
    logger.info(`Messages Retrieved: ${messages.data.length} messages`);

    const assistantMessage = messages.data.find((msg: AssistantMessage) => msg.role === "assistant");
    const response = extractResponseContent(assistantMessage);

    logger.info(`Assistant Response: ${response}`);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error: ${error.message}`);
    } else {
      logger.error("Unknown error occurred.");
    }
    return "An unexpected error occurred while processing your request.";
  }
};
