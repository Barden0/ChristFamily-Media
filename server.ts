import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(process.cwd(), "user_data.json");

// Helper to read/write data
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
};

const writeData = (data: any) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// API Routes
app.get("/api/user/:email", (req, res) => {
  const { email } = req.params;
  const data = readData();
  res.json(data[email] || { streak: 0, bookmarks: [], listeningStats: { totalSeconds: 0, history: [] } });
});

app.post("/api/user/:email/sync", (req, res) => {
  const { email } = req.params;
  const { streak, bookmarks, lastVisitDate } = req.body;
  const data = readData();
  
  data[email] = {
    ...data[email],
    streak,
    bookmarks,
    lastVisitDate
  };
  
  writeData(data);
  res.json({ status: "ok" });
});

app.post("/api/user/:email/listen", (req, res) => {
  const { email } = req.params;
  const { sermonId, sermonTitle, albumTitle, durationSeconds } = req.body;
  const data = readData();
  
  if (!data[email]) {
    data[email] = { streak: 0, bookmarks: [], listeningStats: { totalSeconds: 0, history: [] } };
  }
  
  const stats = data[email].listeningStats || { totalSeconds: 0, history: [] };
  stats.totalSeconds += durationSeconds;
  
  // Add to history for "Wrapped" stats
  stats.history.push({
    sermonId,
    sermonTitle,
    albumTitle,
    timestamp: new Date().toISOString(),
    duration: durationSeconds
  });
  
  data[email].listeningStats = stats;
  writeData(data);
  res.json({ status: "ok" });
});

app.get("/api/user/:email/wrapped", (req, res) => {
  const { email } = req.params;
  const data = readData();
  const user = data[email];
  
  if (!user || !user.listeningStats) {
    return res.json({ totalHours: 0, topSermon: null, topAlbum: null });
  }
  
  const stats = user.listeningStats;
  const sermonCounts: Record<string, { title: string, count: number }> = {};
  const albumCounts: Record<string, { title: string, count: number }> = {};
  
  stats.history.forEach((item: any) => {
    if (item.sermonId) {
      sermonCounts[item.sermonId] = {
        title: item.sermonTitle,
        count: (sermonCounts[item.sermonId]?.count || 0) + 1
      };
    }
    if (item.albumTitle) {
      albumCounts[item.albumTitle] = {
        title: item.albumTitle,
        count: (albumCounts[item.albumTitle]?.count || 0) + 1
      };
    }
  });
  
  const topSermon = Object.values(sermonCounts).sort((a, b) => b.count - a.count)[0] || null;
  const topAlbum = Object.values(albumCounts).sort((a, b) => b.count - a.count)[0] || null;
  
  res.json({
    totalHours: Math.round((stats.totalSeconds / 3600) * 10) / 10,
    topSermon,
    topAlbum
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
