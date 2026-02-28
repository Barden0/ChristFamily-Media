import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import fs from "fs";
import path from "path";

export const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(process.cwd(), "user_data.json");

// NOTE: On Netlify, local file storage is ephemeral and will be lost between function calls or redeploys.
// For production use on Netlify, consider using a database like Firebase Firestore or MongoDB.

// Helper to read/write data
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (e) {
    return {};
  }
};

const writeData = (data: any) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to write data:", e);
  }
};

const apiRouter = express.Router();

// API Routes
apiRouter.get("/user/:email", (req, res) => {
  const { email } = req.params;
  const data = readData();
  res.json(data[email] || { streak: 0, bookmarks: [], listeningStats: { totalSeconds: 0, history: [] } });
});

apiRouter.post("/user/:email/sync", (req, res) => {
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

apiRouter.post("/user/:email/listen", (req, res) => {
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

apiRouter.get("/user/:email/wrapped", (req, res) => {
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

// WordPress Proxy
apiRouter.all("/wp-proxy/*", async (req, res) => {
  const wpPath = (req.params as any)[0];
  const query = req.url.split('?')[1] || '';
  const targetUrl = `https://christfamilymedia.org/wp-json/${wpPath}${query ? '?' + query : ''}`;
  
  try {
    const fetchOptions: any = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ChristFamilyMedia-App/1.0',
      }
    };

    if (req.headers.authorization) {
      fetchOptions.headers['Authorization'] = req.headers.authorization;
    }

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

app.use("/api", apiRouter);

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

if (process.env.NODE_ENV !== "production" || !process.env.NETLIFY) {
  startServer();
}
