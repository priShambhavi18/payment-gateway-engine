const { redisClient } = require("./redis.client");

async function getCache(key) {
  const value = await redisClient.get(key);

  return value ? JSON.parse(value) : null;
}

async function setCache(key, value, ttl = 300) {
  await redisClient.setEx(key, ttl, JSON.stringify(value));
}

async function incrementCounter(key, ttl = 60) {
  const count = await redisClient.incr(key);

  if (count === 1) {
    await redisClient.expire(key, ttl);
  }

  return count;
}

module.exports = {
  getCache,
  setCache,
  incrementCounter
};

