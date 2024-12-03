import { Client, GatewayIntentBits, Message } from "discord.js";
import axios from "axios";
import * as dotenv from "dotenv";


dotenv.config();

// Environment Variable Validation
const REQUIRED_ENV_VARS = ["DISCORD_TOKEN", "DISCORD_CHANNEL_IDS", "API_BASE_URL"];
REQUIRED_ENV_VARS.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Environment variable ${envVar} is missing.`);
    process.exit(1);
  }
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
const CHANNEL_IDS = process.env.DISCORD_CHANNEL_IDS!.split(",");
const API_PORT = process.env.PORT || 5000;
const API_BASE_URL = `http://localhost:${API_PORT}`;

// Initialize Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Conversation cache
const channelConversations: Record<string, any> = {};

// Logging Helper
const log = (level: string, message: string) => {
  console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`);
};

// Load Previous Conversations
const loadPreviousConversations = async (channelId: string) => {
  try {
    log("debug", `Loading previous conversations for channel ${channelId}`);
    const response = await axios.get(`${API_BASE_URL}/getConversation/${channelId}`);
    const conversation = response.data;

    if (
      conversation?.conversations &&
      Array.isArray(conversation.conversations) &&
      conversation.conversations.every((entry: any) => Array.isArray(entry.entries))
    ) {
      channelConversations[channelId] = conversation.conversations;
      log("info", `Loaded conversations for channel ${channelId}`);
    } else {
      log("warning", `Invalid conversation structure for channel ${channelId}`);
    }
  } catch (error) {
    log("error", `Error loading conversations for channel ${channelId}: ${error}`);
  }
};

// Build Prompt Context
const buildPromptContext = (channelId: string): string => {
  let previousContext = "";

  if (channelConversations[channelId]) {
    const recentEntries = Object.values(channelConversations[channelId])
      .flatMap((dateGroup: any) => dateGroup.entries)
      .slice(-5); // Get the last 5 entries

    for (const entry of recentEntries) {
      const userMessage = entry.userMessage || "";
      const botResponse = entry.botResponse || "";
      previousContext += `User: ${userMessage}\nBot: ${botResponse}\n`;
    }
  }

  return previousContext;
};

// ChatGPT Response Function
const chatGPTResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/chatgpt`, { prompt });
    return response.data.response || "No response received.";
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || "Unknown error occurred.";
    log("error", `Error communicating with OpenAI: ${errorMessage}`);
    return "I'm sorry, I couldn't process your request.";
  }
};

// Save Conversation Locally
const saveConversation = (channelId: string, userMessage: string, botResponse: string, timestamp: string) => {
  const dateKey = timestamp.split("T")[0]; // Extract date in YYYY-MM-DD format

  if (!channelConversations[channelId]) {
    channelConversations[channelId] = {};
  }

  if (!channelConversations[channelId][dateKey]) {
    channelConversations[channelId][dateKey] = { entries: [] };
  }

  channelConversations[channelId][dateKey].entries.push({
    userMessage,
    botResponse,
    timestamp,
  });
};

// Discord Event: Ready
client.once("ready", async () => {
  log("info", `Logged in as ${client.user?.tag}`);
  log("info", "Bot is ready and retrieving past conversations.");

  if (CHANNEL_IDS.length === 0) {
    log("warning", "No DISCORD_CHANNEL_IDS found in environment.");
    return;
  }

  for (const channelId of CHANNEL_IDS) {
    await loadPreviousConversations(channelId.trim());
  }
});

// Discord Event: Message Create
client.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return;

  const channelId = message.channel.id;
  const discordId = message.author.id;

  // Build Context
  const previousContext = buildPromptContext(channelId);
  const prompt = `${previousContext}\nUser: ${message.content}\nBot:`;

  // Get Response
  const response = await chatGPTResponse(prompt);

  // Reply to Discord
  try {
    await message.reply(response);
  } catch (error) {
    log("error", `Failed to send message to Discord: ${error}`);
  }

  // Save Conversation
  const timestamp = new Date().toISOString();
  saveConversation(channelId, message.content, response, timestamp);

  // Save to API
  const apiPayload = {
    discordId,
    channelId,
    userMessage: message.content,
    botResponse: response,
  };

  try {
    await axios.post(`${API_BASE_URL}/saveConversation`, apiPayload, {
      headers: { "Content-Type": "application/json" },
    });
    log("info", "Conversation saved to API successfully.");
  } catch (error) {
    log("error", `Failed to save conversation to API: ${error}`);
  }
});

// Start Bot
if (!DISCORD_TOKEN) {
  log("error", "DISCORD_TOKEN is not set.");
  process.exit(1);
} else {
  log("info", "Starting bot...");
  client.login(DISCORD_TOKEN);
}
