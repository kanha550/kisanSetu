const mongoose = require('mongoose');

async function main() {
  const primaryUri = process.env.DB_CONNECT_STRING;
  const fallbackUri = 'mongodb://127.0.0.1:27017/KisanSetu';

  try {
    console.log('Connecting to primary MongoDB Database...');
    await mongoose.connect(primaryUri);
    console.log("Mongoose connected successfully to Cloud Atlas!");
  } catch (err) {
    console.log("Mongoose Cloud Atlas Connection Failed: " + err.message);
    try {
      console.log('Attempting fallback to local MongoDB instance (mongodb://127.0.0.1:27017/KisanSetu)...');
      await mongoose.connect(fallbackUri);
      console.log("Mongoose connected successfully to Local MongoDB!");
    } catch (localErr) {
      console.log("Mongoose local fallback connection also failed: " + localErr.message);
      console.log("Please ensure a local MongoDB server is running or check your internet settings.");
    }
  }
}

module.exports = main;