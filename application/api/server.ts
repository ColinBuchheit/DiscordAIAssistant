import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { connectToDatabase, saveConversation, getUserConversation, client } from '../../infrastructure/database';
import rateLimit from 'express-rate-limit';  // Import for rate limiting

dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'PORT'];
requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        console.error(`Environment variable ${envVar} is missing.`);
        process.exit(1);
    }
});

const app = express();
app.use(express.json());

const port = process.env.PORT || 5000;

// Connect to the database when the server starts
connectToDatabase();

// Middleware for validation
const validateConversationRequest = (req: Request, res: Response, next: NextFunction): void => {
    const { discordId, userMessage, botResponse } = req.body;

    if (!discordId || !userMessage || !botResponse) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
    }

    next();
};

const validateDiscordIdParam = (req: Request, res: Response, next: NextFunction): void => {
    const { discordId } = req.params;

    if (!discordId || !/^\d+$/.test(discordId)) {
        res.status(400).json({ message: 'Invalid Discord ID' });
        return;
    }

    next();
};

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction): Promise<void> =>
        Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

app.use((err: any, _req: Request, res: Response, _next: Function) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

// **Add this root route to handle requests to "/"**
app.get('/', (_req: Request, res: Response) => {
    res.send('Welcome to the DiscordAI Assistant API!');
});

// Endpoint to save a conversation
app.post('/saveConversation', apiLimiter, validateConversationRequest, asyncHandler(async (req: Request, res: Response) => {
    const { discordId, userMessage, botResponse } = req.body;
    await saveConversation(discordId, userMessage, botResponse);
    res.status(200).json({ message: 'Conversation saved successfully' });
}));

// Endpoint to get a conversation by Discord ID
app.get('/getConversation/:discordId', validateDiscordIdParam, asyncHandler(async (req: Request, res: Response) => {
    const { discordId } = req.params;
    const conversation = await getUserConversation(discordId);

    if (!conversation) {
        res.status(404).json({ message: 'Conversation not found' });
        return;
    }

    res.status(200).json(conversation);
}));



const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


process.on('SIGINT', () => {
    console.log('Gracefully shutting down...');
    server.close(async () => {
        try {
            await client.close();
            console.log('MongoDB connection closed.');
        } catch (error) {
            console.error('Error while closing MongoDB connection:', error);
        }
        process.exit(0);
    });
});
