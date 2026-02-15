const redis = require('redis');
require('dotenv').config();



    const client = redis.createClient({
      url: process.env.REDIS_URI
    
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    (async () => {
  try {
  
    await client.connect();

    console.log('✅ Connected successfully to Redis!');
 
  } catch (err) {
    console.error('❌ Connection attempt failed:', err);
  }
})();

module.exports = client;