import { OpenAI } from "openai";
import dotenv from "dotenv";
import winston from "winston";

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

// Load environment variables
dotenv.config();

// Set OpenAI API key and assistant key
const CHATGPT_API_KEY = process.env.CHATGPT_API_KEY;
const ASSISTANT_KEY = process.env.ASSISTANT_KEY;

if (!CHATGPT_API_KEY) {
  logger.error("CHATGPT_API_KEY is not set in the environment variables.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: CHATGPT_API_KEY });

export const chatGPTResponse = async (prompt: string): Promise<string> => {
  try {
    if (!ASSISTANT_KEY) {
      throw new Error("ASSISTANT_KEY is not set in the environment variables.");
    }

    // Log assistant key and prompt
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
    let status = run.status;
    while (status === "queued" || status === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for 500ms
      const updatedRun = await openai.beta.threads.runs.retrieve(threadId, runId);
      status = updatedRun.status;
      logger.debug(`Run Status: ${status}`);
    }

    logger.info(`Run Completed: ${status}`);

    // Step 5: Retrieve the messages
    const messages = await openai.beta.threads.messages.list(threadId);
    logger.info(`Messages Retrieved: ${messages.data.length} messages`);
    logger.debug(`Raw Messages: ${JSON.stringify(messages.data, null, 2)}`);

    const assistantMessage = messages.data.find((msg) => msg.role === "assistant");

    if (assistantMessage && Array.isArray(assistantMessage.content)) {
      // Handle content as an array
      logger.debug(
        `Assistant Message Content: ${JSON.stringify(
          assistantMessage.content,
          null,
          2
        )}`
      );

      const responseText = assistantMessage.content
        .map((item) =>
          item.type === "text" && item.text?.value ? item.text.value : ""
        )
        .join(" ")
        .trim();

      if (responseText) {
        logger.info(`Assistant Response: ${responseText}`);
        return responseText;
      } else {
        logger.warn("No valid response content received from the assistant.");
        return "No response received.";
      }
    } else if (assistantMessage && typeof assistantMessage.content === "string") {
      // Handle content as a simple string
      logger.info(`Assistant Response: ${assistantMessage.content}`);
      return assistantMessage.content;
    } else {
      logger.warn("No response received from the assistant.");
      return "No response received.";
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error: ${error.message}`);
    } else {
      logger.error("Unknown error occurred.");
    }
    return "An unexpected error occurred while processing your request.";
  }
  
};

