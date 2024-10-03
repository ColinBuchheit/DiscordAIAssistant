import { MongoClient, Db, Collection, Document } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

let db: Db;
let collection: Collection<Document>;

interface Conversation extends Document { // Extend Document to avoid incompatibility issues
  discordId: string;
  userMessage: string;
  botResponse: string;
  timestamp: Date;
}

// Connect to MongoDB and set up the database and collection
export async function connectToDatabase(): Promise<void> {
  try {
    await client.connect();
    db = client.db('discordBotDB');
    collection = db.collection('conversations'); // Use generic Document type here
    console.log('Connected to MongoDB and initialized conversations collection');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Save a conversation to MongoDB
export async function saveConversation(
  discordId: string,
  userMessage: string,
  botResponse: string
): Promise<void> {
  const conversation: Conversation = {
    discordId,
    userMessage,
    botResponse,
    timestamp: new Date(),
  };

  try {
    await collection.insertOne(conversation as Document); // Cast to Document here
    console.log('Conversation saved successfully.');
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}
