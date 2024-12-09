import 'dotenv/config.js';
import Redis from 'ioredis';

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

const redis = new Redis({
	host: REDIS_HOST || 'localhost',
	port: REDIS_PORT || 6379,
	password: REDIS_PASSWORD || undefined,
});
redis.connect(() => {
	console.log('Connected to Redis');
});

redis.on('error', err => {
	console.error('Redis Client Error', err);
});

export default redis;
