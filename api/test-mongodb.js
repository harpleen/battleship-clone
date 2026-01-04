require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    // Test your connection string
    const url = 'mongodb+srv://harpleen_db_user:LT87ecvQPuatZ1Rp@battleship.ew9ca4z.mongodb.net/battleship?retryWrites=true&w=majority&appName=BattleShip';
    
    console.log('Testing MongoDB connection...');
    console.log('Connection string:', url.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    await mongoose.connect(url);
    console.log('✅ MongoDB connection successful!');
    
    // Check if database exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check if users collection exists
    const hasUsers = collections.some(c => c.name === 'users');
    console.log('Users collection exists:', hasUsers);
    
    mongoose.connection.close();
    console.log('Connection closed.');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\nCommon fixes:');
    console.log('1. Go to MongoDB Atlas → Network Access → Add IP 0.0.0.0/0');
    console.log('2. Check your username/password in connection string');
    console.log('3. Make sure your cluster is running (not paused)');
  }
}

testConnection();