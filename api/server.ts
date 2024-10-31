import express, { Request, Response, NextFunction, Application } from 'express';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import {
    connectToDatabase,
    saveConversation,
    getUserConversation,
    client,
} from '../infrastructure/database';

// Load environment variables
dotenv.config();

// Initialize Express app with correct typing
const app: Application = express();
const port = process.env.PORT || 5000;

app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

// Ensure MongoDB connection is established
connectToDatabase()
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    });

// Async handler to wrap all async routes (to avoid unhandled promise rejections)
const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(fn(req, res, next)).catch(next);

// Root route
app.get(
    '/',
    (_req: Request, res: Response): void => {
        res.send('Welcome to the DiscordAI Assistant API!');
    }
);

// Save conversation endpoint with async handler
app.post(
    '/saveConversation',
    apiLimiter,
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { discordId, userMessage, botResponse } = req.body;
        await saveConversation(discordId, userMessage, botResponse);
        res.status(200).json({ message: 'Conversation saved successfully.' });
    })
);

// Get conversation endpoint with async handler
app.get(
    '/getConversation/:discordId',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { discordId } = req.params;
        const conversation = await getUserConversation(discordId);

        if (!conversation) {
            res.status(404).json({ message: 'Conversation not found.' });
        } else {
            res.status(200).json(conversation);
        }
    })
);

// Error handling middleware
app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction): void => {
        console.error('Unhandled Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
);

// Start the server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await client.close();
    server.close(() => process.exit(0));
});
