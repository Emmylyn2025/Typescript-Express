"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
require("dotenv/config");
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL
});
redisClient.on('error', (error) => {
    console.log('Error from redis', error);
});
(async () => {
    await redisClient.connect();
    console.log('Connected to Redis');
})();
exports.default = redisClient;
