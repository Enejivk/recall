import { createClient } from "redis";

const client = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6380,
  },
});

client.on("error", (err) => console.error("Redis Client Error", err));

await client.connect();

class Cache {
  // Set cache
  static async set(key: string, value: any) {
    try {
      const stringValue = JSON.stringify(value);
      await client.set(key, stringValue);
    } catch (error) {
      throw new Error(`Error setting cache for key "${key}": ${error}`);
    }
  }

  // Get cache
  static async get(key: string) {
    try {
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Error getting cache for key "${key}": ${error}`);
    }
  }

  // Delete cache
  static async del(key: string) {
    try {
      await client.del(key);
    } catch (error) {
      throw new Error(`Error deleting cache for key "${key}": ${error}`);
    }
  }

  // Check if cache exists
  static async exists(key: string) {
    try {
      const exists = await client.exists(key);
      return exists === 1;
    } catch (error) {
      throw new Error(
        `Error checking cache existence for key "${key}": ${error}`
      );
    }
  }
}


export default Cache;
