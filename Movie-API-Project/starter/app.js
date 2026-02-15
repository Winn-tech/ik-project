require("dotenv").config();
require("express-async-errors");
//const cron = require("node-cron");
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const router = require("./routes/auth");
const connectDB = require("./db/connect");
const authentication = require("./middleware/authentication");
// const homeRouter = require("./routes/Homepage");
const profileRouter = require("./routes/profile");
const favouriteRouter = require("./routes/favorite");
const watchlistRouter = require("./routes/watchlist");
const reviewRouter = require("./routes/review");
const circleRouter = require("./routes/circle");
const leaderboardRouter = require("./routes/leaderboard");
const circleThreadRouter = require("./routes/circleThread");
const userPublicRouter = require("./routes/publicUser");
const filmhouseRoutes = require("./routes/filmhouse");
const ebonyLifeRoutes = require("./routes/ebonyLife");
const notificationRouter = require("./routes/notification");
const generateWeeklyLeaderboard = require("./utils/generateWeeklyLeaderBoard"); //initially needed when cronjob was here

const app = express();
const port = 9000;
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

// 🔌 Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      "https://movie-flicks.vercel.app",
      "http://localhost:8081",
      "http://localhost:8080",
      "http://localhost:9000",
    ],

    credentials: true,
  },
});
/*cron.schedule("0 0 * * 0", () => {
  console.log("📆 Running weekly leaderboard...");
  generateWeeklyLeaderboard();
});*/

// store `io` globally so you can use it in controllers
global._io = io;

const connectedUsers = {};

io.on("connection", (socket) => {
  console.log(`🔌 New user connected: ${socket.id}`);

  socket.on("joinRoom", (username) => {
    socket.join(username);
    console.log(`Socket ${socket.id} joined room: ${username}`);
  });

  socket.on("registerUser", (username) => {
    connectedUsers[username] = socket.id;
    console.log(`✅ Registered user: ${username} with socket ID: ${socket.id}`);
  });

  socket.on("disconnect", () => {
    for (const username in connectedUsers) {
      if (connectedUsers[username] === socket.id) {
        delete connectedUsers[username];
        break;
      }
    }
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

const allowedOrigins = [
  "https://movie-flicks.vercel.app",
  "http://localhost:8081",
  "http://localhost:8080",
];

/*app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    credentials: true,
  })
);*/

app.use(
  cors({
    origin: ["http://localhost:9000", "http://localhost:8080"],
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use("/api/v1/auth", router);
// app.use("/api/v1/home", homeRouter);
app.use("/api/v1/user/profile", authentication, profileRouter);
app.use("/api/v1/user/favourites", authentication, favouriteRouter);
app.use("/api/v1/user/watchlist", authentication, watchlistRouter);
app.use("/api/v1/user/review", reviewRouter);
app.use("/api/v1/user/circle", authentication, circleRouter);
app.use("/api/v1/user/circleThread", authentication, circleThreadRouter);
app.use("/api/v1/leaderboard", leaderboardRouter);
app.use("/api/v1/public/users", userPublicRouter);
app.use("/api/filmhouse", filmhouseRoutes);
app.use("/api/ebonylife", ebonyLifeRoutes);
app.use("/api/notification", authentication, notificationRouter);

// Serve React frontend (for local dev & Vercel production)
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    console.log("DB is connected");
    app.set("io", io);
    app.set("connectedUsers", connectedUsers);
    server.listen(port, () => {
      console.log(`App is listening on port ${port}`);
    });
  } catch (err) {
    console.log(err);
  }
};
start();

module.exports = app;
