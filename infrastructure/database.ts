import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
export const client = new MongoClient(uri); // Export client

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

// Connect to MongoDB
export async function connectToDatabase(): Promise<void> {
  try {
    if (!db || !collection) { // Check if db and collection are already initialized
      await client.connect();
      db = client.db('discordBotDB');
      collection = db.collection<Conversation>('conversations');
      console.log('Connected to MongoDB and initialized conversations collection');

      // Optionally create an index on `discordId` to optimize lookups
      await collection.createIndex({ discordId: 1 });
    } else {
      console.log('MongoDB connection already established.');
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

// Save a conversation to MongoDB
export async function saveConversation(
  discordId: string,
  userMessage: string,
  botResponse: string
): Promise<void> {
  const timestamp = new Date();
  const date = timestamp.toISOString().split('T')[0]; // Extract date in "YYYY-MM-DD" format
  const newEntry: ConversationEntry = {
    userMessage,
    botResponse,
    timestamp,
  };

  try {
    const existingConversation = await collection.findOne({ discordId });

    if (existingConversation) {
      // Check if there is already a conversation for the current date
      const existingDailyConversation = existingConversation.conversations.find(
        (conversation: DailyConversation) => conversation.date === date
      );

      if (existingDailyConversation) {
        // If the date exists, add the new entry to that day's conversations
        await collection.updateOne(
          { discordId, 'conversations.date': date },
          { $push: { 'conversations.$.entries': newEntry } }
        );
      } else {
        // If the date does not exist, create a new conversation for that date
        await collection.updateOne(
          { discordId },
          { $push: { conversations: { date, entries: [newEntry] } } }
        );
      }
    } else {
      // If the user has no existing conversations, create a new document for them
      const newConversation: Conversation = {
        discordId,
        conversations: [
          {
            date,
            entries: [newEntry],
          },
        ],
      };

      await collection.insertOne(newConversation);
    }

    console.log('Conversation saved successfully.');
  } catch (error) {
    console.error('Error saving conversation:', error);
    throw new Error('Failed to save conversation');
  }
}

// Retrieve a user's conversation from MongoDB
export async function getUserConversation(
  discordId: string,
  date?: string
): Promise<Conversation | null> {
  try {
    let conversation: Conversation | null = null;

    if (date) {
      // Retrieve conversation for a specific date
      conversation = await collection.findOne(
        { discordId, 'conversations.date': date },
        { projection: { 'conversations.$': 1 } } // Only return the specific date's conversation
      );
    } else {
      // Return all conversations for the user
      conversation = await collection.findOne({ discordId });
    }

    return conversation || null;
  } catch (error) {
    console.error('Error retrieving conversation:', error);
    throw new Error('Failed to retrieve conversation');
  }
}
