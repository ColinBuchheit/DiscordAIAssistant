import { Client, GatewayIntentBits, Message } from "discord.js";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const API_BASE_URL = process.env.API_BASE_URL || "http://api-application:5000";
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const log = (level: string, message: string) => {
    console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`);
};

const chatGPTResponse = async (prompt: string): Promise<string> => {
    try {
        log("debug", `Sending prompt to GPT: ${prompt}`);
        const response = await axios.post(`${API_BASE_URL}/chatgpt`, { prompt });
        log("info", `Received GPT Response: ${response.data.response}`);
        return response.data.response || "No response received.";
    } catch (error) {
        log("error", `Error communicating with OpenAI: ${error}`);
        return "I'm sorry, I couldn't process your request.";
    }
};

client.once("ready", async () => {
    log("info", `Logged in as ${client.user?.tag}`);
    log("info", "Bot is ready.");
});

client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;

    const channelId = message.channel.id;
    const discordId = message.author.id;

    let conversationHistory = "";

    // Fetch conversation history
    try {
        const response = await axios.get(`${API_BASE_URL}/getConversation/${discordId}/${channelId}`);
        const conversationData = response.data;

        if (conversationData && conversationData.conversations && conversationData.conversations.length > 0) {
            const allEntries = conversationData.conversations.flatMap((dailyConversation: any) =>
                dailyConversation.entries.map((entry: { userMessage: string; botResponse: string, timestamp: string }) => entry)
            );

            // Filter to only include exchanges within the last 5 days
            const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
            const recentEntries = allEntries.filter((entry: { timestamp: string }) => {
                const entryTimestamp = new Date(entry.timestamp).getTime();
                return entryTimestamp >= fiveDaysAgo;
            });

            // Prioritize the last 20 exchanges if available
            const maxEntries = 20;
            const limitedConversations = recentEntries.slice(-maxEntries);

            if (limitedConversations.length > 0) {
                conversationHistory = limitedConversations
                    .map((entry: { userMessage: string; botResponse: string }) => {
                        const userMessage = entry.userMessage || "[No message]";
                        const botResponse = entry.botResponse || "[No response]";
                        return `User: ${userMessage}\nBot: ${botResponse}`;
                    })
                    .join("\n");
                log("info", "Filtered and prioritized conversation history retrieved.");
            } else {
                log("info", "No valid conversation history found within the last 5 days.");
            }
        } else {
            log("info", "No conversation history found.");
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Error fetching conversation history:", error.response?.data || error.message);
        } else {
            console.error("Unexpected error fetching conversation history:", (error as Error).message);
        }
    }

    // Build the prompt with conversation history if available
    const instruction = "You are an AI assistant. Use the following conversation history to provide contextually accurate and relevant responses:";
    const prompt = conversationHistory
        ? `${instruction}\n\n${conversationHistory}\nUser: ${message.content}\nBot:`
        : `${instruction}\n\nUser: ${message.content}\nBot:`;

    // Get GPT response
    const botResponse = await chatGPTResponse(prompt);

    // Send response to user
    try {
        await message.reply(botResponse);
    } catch (error) {
        console.error("Error sending message to Discord:", (error as Error).message);
        await message.reply("Sorry, I encountered an error while trying to respond.");
    }

    // Save the new interaction to the database
    const data = {
        discordId,
        channelId,
        userMessage: message.content,
        botResponse,
    };

    try {
        await axios.post(`${API_BASE_URL}/saveConversation`, data, {
            headers: { "Content-Type": "application/json" },
        });
        log("info", "Conversation saved successfully.");
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Error saving conversation:", error.response?.data || error.message);
        } else {
            console.error("Unexpected error saving conversation:", (error as Error).message);
        }
    }
});

if (!DISCORD_TOKEN) {
    log("error", "DISCORD_TOKEN is not set.");
    process.exit(1);
} else {
    log("info", "Starting bot...");
    client.login(DISCORD_TOKEN).catch((error) => {
        log("error", `Failed to log in to Discord: ${error}`);
    });
}
