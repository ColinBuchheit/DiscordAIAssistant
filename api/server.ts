import express, { Request, Response, NextFunction } from 'express';
import dotenvSafe from 'dotenv-safe';
import { connectToDatabase, saveConversation, getUserConversation, client } from '../infrastructure/database';
import rateLimit from 'express-rate-limit';  // Import for rate limiting

dotenvSafe.config();  // Ensure all required env variables are set

const app = express();
app.use(express.json({ limit: '10kb' }));  // Set a request body size limit

const port = process.env.PORT || 5000;

// Connect to the database when the server starts
connectToDatabase();

// Helper function for error responses
const sendErrorResponse = (res: Response, statusCode: number, message: string) => {
    res.status(statusCode).json({ error: message });
};

// Middleware for validation
const validateConversationRequest = (req: Request, res: Response, next: NextFunction): void => {
    const { discordId, userMessage, botResponse } = req.body;

    if (!discordId || !userMessage || !botResponse) {
        sendErrorResponse(res, 400, 'Missing required fields');
        return;
    }

    next();
};

const validateDiscordIdParam = (req: Request, res: Response, next: NextFunction): void => {
    const { discordId } = req.params;

    if (!discordId || !/^\d+$/.test(discordId)) {
        sendErrorResponse(res, 400, 'Invalid Discord ID');
        return;
    }

    next();
};

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction): Promise<void> =>
        Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

// Error handler middleware
app.use((err: any, _req: Request, res: Response, _next: Function) => {
    console.error('Unhandled Error:', err);

    if (err.name === 'MongoError') {
        sendErrorResponse(res, 500, 'Database error occurred');
    } else {
        sendErrorResponse(res, 500, 'Internal server error');
    }
});

// Rate limiter middleware
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

// Root route
app.get('/', (_req: Request, res: Response) => {
    res.send('Welcome to the DiscordAI Assistant API!');
});

// Health check route
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'UP' });
});

// Save conversation endpoint
app.post('/saveConversation', apiLimiter, validateConversationRequest, asyncHandler(async (req: Request, res: Response) => {
    const { discordId, userMessage, botResponse } = req.body;
    await saveConversation(discordId, userMessage, botResponse);
    res.status(200).json({ message: 'Conversation saved successfully' });
}));

// Get conversation endpoint
app.get('/getConversation/:discordId', validateDiscordIdParam, asyncHandler(async (req: Request, res: Response) => {
    const { discordId } = req.params;
    const conversation = await getUserConversation(discordId);

    if (!conversation) {
        sendErrorResponse(res, 404, 'Conversation not found');
        return;
    }

    res.status(200).json(conversation);
}));

// 404 handler
app.use((err: any, _req: Request, res: Response, _next: Function) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ message: 'Internal server error' });
});


// Start the server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Graceful shutdown
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
