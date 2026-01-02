import express from "express";
import mongoose from "mongoose";
import cors from "cors";
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
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

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    photo: { type: String, required: true }, 
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Post =
  mongoose.models.Post || mongoose.model("Post", PostSchema);

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

app.post("/admin/login", (req, res) => {
  const { adminId, adminPass } = req.body;

  if (
    adminId === process.env.ADMIN_ID &&
    adminPass === process.env.ADMIN_PASS
  ) {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});
export default app;
