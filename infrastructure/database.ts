import { MongoClient, Db, Collection, Document } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/discordBotDB';
export const client = new MongoClient(uri, { maxPoolSize: 10 });

let db: Db;
let collection: Collection<Document>; // Use Document type for MongoDB collections

interface ConversationEntry {
  userMessage: string;
  botResponse: string;
  timestamp: Date;
}

interface Conversation {
  discordId: string;
  entries: ConversationEntry[];
}

export async function connectToDatabase(): Promise<void> {
  try {
    await client.connect();
    db = client.db('discordBotDB');
    collection = db.collection('conversations');
    await collection.createIndex({ discordId: 1 }); // Index for faster queries
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
  }
}

export async function saveConversation(
  discordId: string,
  userMessage: string,
  botResponse: string
): Promise<void> {
  const timestamp = new Date();
  const newEntry: ConversationEntry = { userMessage, botResponse, timestamp };

  await collection.updateOne(
    { discordId },
    { $push: { entries: newEntry } as any }, // Ensure compatibility with MongoDB
    { upsert: true }
  );
}

export async function getUserConversation(discordId: string): Promise<Conversation | null> {
  const result = await collection.findOne({ discordId });

  if (!result) return null;

  // Safely cast the result to the Conversation type
  return {
      discordId: result.discordId as string,
      entries: result.entries as ConversationEntry[],
  };
}
