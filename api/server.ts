import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { connectToDatabase, saveConversation, getUserConversation, client } from "../infrastructure/database";
import rateLimit from "express-rate-limit";
import { chatGPTResponse } from "../application/openai"; //import the OpenAI interaction logic

dotenv.config();

const requiredEnvVars = ["MONGODB_URI", "PORT"];
requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        console.error(`Environment variable ${envVar} is missing.`);
        process.exit(1);
    }
});

const app = express();
app.use(express.json());

const port = process.env.PORT || 5000;

//connect to the database when the server starts
connectToDatabase();

//middleware for validation
const validateConversationRequest = (req: Request, res: Response, next: NextFunction): void => {
    const { discordId, userMessage, botResponse } = req.body;

    if (!discordId || !userMessage || !botResponse) {
        res.status(400).json({ message: "Missing required fields" });
        return;
    }

    next();
};

//rate limiter middleware
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, //limit each IP to 100 requests per windowMs
});

//helper to wrap async handlers to ensure correct return type
const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch(next);
    };

// Root route
app.get("/", (_req: Request, res: Response) => {
    res.send("Welcome to the DiscordAI Assistant API!");
});

// Endpoint to save a conversation
app.post(
    "/saveConversation",
    apiLimiter,
    validateConversationRequest,
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { discordId, channelId, userMessage, botResponse } = req.body;

        await saveConversation(discordId, channelId, userMessage, botResponse);
        res.status(200).json({ message: "Conversation saved successfully" });
    })
);


app.get("/getConversation/:discordId/:channelId", asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { discordId, channelId } = req.params;

    try {
        const conversation = await getUserConversation(discordId, channelId);

        if (!conversation) {
            console.log(`No conversations found for discordId ${discordId} and channelId ${channelId}.`);
            res.status(404).json({ message: "Conversation not found." });
        } else {
            console.log(`Retrieved conversations for discordId ${discordId} and channelId ${channelId}.`);
            res.status(200).json(conversation);
        }
    } catch (error) {
        console.error("Error retrieving conversation:", error);
        res.status(500).json({ message: "Failed to retrieve conversation." });
    }
}));



// **New Endpoint for ChatGPT Interaction**
app.post(
    "/chatgpt",
    apiLimiter,
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { prompt } = req.body;

        if (!prompt) {
            res.status(400).json({ message: "Prompt is required" });
            return;
        }

        console.log(`Received ChatGPT prompt: ${prompt}`);
        const response = await chatGPTResponse(prompt);
        res.status(200).json({ response });
    })
);

// Global error handler middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ message: "Internal server error" });
});

// Start the server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Graceful shutdown handling
process.on("SIGINT", async () => {
    console.log("Shutting down gracefully...");
    await client.close();
    server.close(() => process.exit(0));
});
