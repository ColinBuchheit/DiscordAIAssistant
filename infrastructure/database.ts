import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://mongo:27017/discordBotDB';
export const client = new MongoClient(uri, { maxPoolSize: 10 }); // Removed useUnifiedTopology

let db: Db;
let collection: Collection<Conversation>;

// Conversation types
interface ConversationEntry {
  userMessage: string;
  botResponse: string;
  timestamp: Date;
}

interface DailyConversation {
  date: string;
  entries: ConversationEntry[];
}

interface Conversation {
  discordId: string;
  conversations: DailyConversation[];
}

// Connect to MongoDB with retry logic
export async function connectToDatabase(): Promise<void> {
  const maxRetries = 5;
  let retries = maxRetries;

  while (retries) {
    try {
      if (!db || !collection) {
        await client.connect();
        db = client.db('discordBotDB');
        collection = db.collection<Conversation>('conversations');
        console.log('Connected to MongoDB and initialized conversations collection');
        await collection.createIndex({ discordId: 1 });
      } else {
        console.log('MongoDB connection already established.');
      }
      break;
    } catch (error) {
      retries -= 1;
      console.error(`Error connecting to MongoDB: ${(error as Error).message}. Retries left: ${retries}`);
      if (retries === 0) throw new Error('Failed to connect to MongoDB after multiple attempts');
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
}

// Save a conversation to MongoDB with upsert
export async function saveConversation(
  discordId: string,
  userMessage: string,
  botResponse: string
): Promise<void> {
  const timestamp = new Date();
  const date = timestamp.toISOString().split('T')[0];
  const newEntry: ConversationEntry = { userMessage, botResponse, timestamp };

  try {
    await collection.updateOne(
      { discordId, 'conversations.date': date },
      {
        $push: { 'conversations.$.entries': newEntry },
        $setOnInsert: { discordId, conversations: [{ date, entries: [newEntry] }] }
      },
      { upsert: true }
    );
    console.log('Conversation saved successfully.');
  } catch (error) {
    console.error('Error saving conversation:', (error as Error).message);
    throw new Error('Failed to save conversation');
  }
}

// Retrieve a user's conversation
export async function getUserConversation(
  discordId: string,
  date?: string
): Promise<Conversation | null> {
  try {
    const query = date ? { discordId, 'conversations.date': date } : { discordId };
    const projection = date ? { 'conversations.$': 1 } : undefined;
    const conversation = await collection.findOne(query, { projection });

    return conversation || null;
  } catch (error) {
    console.error('Error retrieving conversation:', (error as Error).message);
    throw new Error('Failed to retrieve conversation');
  }
}

// Ensure safe shutdown of MongoDB client
process.on('SIGINT', async () => {
  console.log('Closing MongoDB client...');
  await client.close();
  process.exit(0);
});
