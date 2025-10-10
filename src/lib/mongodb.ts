import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || ""
if (!uri) {
  // Leave it silent in production builds; runtime will throw when attempting to connect
}

let cachedClient: MongoClient | null = null

export async function getMongoClient() {
  if (cachedClient) return cachedClient
  if (!uri) {
    throw new Error("MONGODB_URI is not configured. Please set MONGODB_URI environment variable.")
  }
  const client = new MongoClient(uri)
  await client.connect()
  cachedClient = client
  return client
}

export async function getDb(dbName = "gas_station") {
  const client = await getMongoClient()
  return client.db(dbName)
}
