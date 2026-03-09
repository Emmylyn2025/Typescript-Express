import { createClient } from "redis";
import 'dotenv/config';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (error) => {
  console.log('Error from redis', error);
});

(async () => {
  await redisClient.connect();
  console.log('Connected to Redis');
})();

export default redisClient;