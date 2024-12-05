import { Client, GatewayIntentBits, Message } from "discord.js";
import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || "http://api-application:5000";
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_IDS = process.env.DISCORD_CHANNEL_IDS ? process.env.DISCORD_CHANNEL_IDS.split(",") : [];

// Logging helper
const log = (level: string, message: string) => {
    console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`);
};

// Function to send the message to OpenAI and get a response
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

// Discord event: Ready
client.once("ready", async () => {
    log("info", `Logged in as ${client.user?.tag}`);
    log("info", "Bot is ready.");

    if (CHANNEL_IDS.length === 0) {
        log("warning", "No DISCORD_CHANNEL_IDS found in environment.");
    }
});

// Discord event: Message Create
client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return; // Ignore bot messages

    const channelId = message.channel.id;
    const discordId = message.author.id;

    let conversationHistory = ""; // Initialize conversation history

    try {
        const response = await axios.get(`${API_BASE_URL}/getConversation/${discordId}/${channelId}`);
        const conversationData = response.data;
    
        if (conversationData && conversationData.conversations && conversationData.conversations.length > 0) {
            // Flatten all entries from all dates into a single array
            const allEntries = conversationData.conversations.flatMap((dailyConversation: any) =>
                dailyConversation.entries.map((entry: { userMessage: string; botResponse: string }) => entry)
            );
    
            // Filter out interactions where botResponse is empty or undefined
            const filteredConversations = allEntries.filter((entry: { userMessage: string; botResponse: string }) => {
                return entry.botResponse && entry.userMessage; // Only include complete conversations
            });
    
            if (filteredConversations.length > 0) {
                // Format the conversation history for the prompt
                conversationHistory = filteredConversations
                    .map((entry: { userMessage: string; botResponse: string }) => {
                        const userMessage = entry.userMessage || "[No message]";
                        const botResponse = entry.botResponse || "[No response]";
                        return `User: ${userMessage}\nBot: ${botResponse}`;
                    })
                    .join("\n");
                log("info", "Filtered conversation history retrieved.");
            } else {
                log("info", "No valid conversation history found.");
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
    

    // Step 2: Build the prompt with the conversation history
    const prompt = `${conversationHistory}\nUser: ${message.content}\nBot:`;

    // Step 3: Get response from GPT
    const botResponse = await chatGPTResponse(prompt);

    // Step 4: Send response to the user
    try {
        await message.reply(botResponse);
    } catch (error) {
        console.error("Error sending message to Discord:", (error as Error).message);
    }

    // Step 5: Save the new interaction to the database
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
        console.log("Conversation saved successfully.");
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Error saving conversation:", error.response?.data || error.message);
        } else {
            console.error("Unexpected error saving conversation:", (error as Error).message);
        }
    }
});



// Start the bot
if (!DISCORD_TOKEN) {
    log("error", "DISCORD_TOKEN is not set.");
    process.exit(1);
} else {
    log("info", "Starting bot...");
    client.login(DISCORD_TOKEN).catch((error) => {
        log("error", `Failed to log in to Discord: ${error}`);
    });
}
