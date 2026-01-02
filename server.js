import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ---------- MongoDB Connection (SERVERLESS SAFE) ----------
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        bufferCommands: false
      })
      .then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// ---------- Schema & Model ----------
const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    photo: { type: String, required: true }, // Google Drive link
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Post =
  mongoose.models.Post || mongoose.model("Post", PostSchema);

// ---------- Routes ----------

// Health check
app.get("/", (req, res) => {
  res.send("API is running");
});

// Get all posts
app.get("/posts", async (req, res) => {
  try {
    await connectDB();
    const posts = await Post.find().sort({ date: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create post
app.post("/posts", async (req, res) => {
  try {
    await connectDB();

    const { title, description, photo } = req.body;

    if (!title || !description || !photo) {
      return res
        .status(400)
        .json({ error: "title, description and photo are required" });
    }

    const post = await Post.create({
      title,
      description,
      photo
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Export for Vercel ----------
export default app;
