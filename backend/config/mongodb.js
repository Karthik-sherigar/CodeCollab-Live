import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
}

let client;
let db;

export const connectMongoDB = async () => {
    if (db) {
        return db;
    }

    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db('collabcode_live');

        console.log('✅ MongoDB connected successfully');

        // Create indexes
        await db.collection('code_snapshots').createIndex({ sessionId: 1 }, { unique: true });

        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
};

export const getDB = () => {
    if (!db) {
        throw new Error('MongoDB not connected. Call connectMongoDB() first.');
    }
    return db;
};

export const closeMongoDB = async () => {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
};
