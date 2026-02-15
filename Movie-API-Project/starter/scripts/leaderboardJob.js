const generateWeeklyLeaderboard =  require("./../utils/generateWeeklyLeaderBoard");
const dotenv =  require("dotenv");
const connectDB =  require("../db/connect");
//const MONGO_URI = 'mongodb+srv://adaezeokoye:E1qSttAOXK4s61l2@movieapi.ui0nr.mongodb.net/?retryWrites=true&w=majority&appName=Movieapi'
dotenv.config();



async function run() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI not set");
        process.exit(1);
    }
    try {
        await connectDB(process.env.MONGO_URI);
        console.log(`[${new Date().toISOString()}] Connected to DB`);


        await generateWeeklyLeaderboard();
        console.log(`[${new Date().toISOString()}] Leaderboard generated successfully`);

        process.exit(0);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error generating leaderboard:`, err);
        process.exit(1);
    }
}

run();
