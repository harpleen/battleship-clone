require("dotenv").config();
const mongoose = require("mongoose");
const MatchmakingQueue = require("./models/matchmakingQueue");

async function clearQueue() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");
        
        const result = await MatchmakingQueue.deleteMany({});
        console.log(`Deleted ${result.deletedCount} queue entries`);
        
        await mongoose.disconnect();
        console.log("Done!");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

clearQueue();