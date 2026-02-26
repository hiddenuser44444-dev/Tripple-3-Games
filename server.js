import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createBareServer } from "@tomphttp/bare-server-node";
import wisp from "@mercuryworkshop/wisp-js";
import http from "http";
import db from "./db.js";
import bodyParser from "body-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const bare = createBareServer("/bare/");
  const PORT = 3000;

  app.use(bodyParser.json());

  // Account Routes
  app.post("/api/auth/signup", (req, res) => {
    const { username, password } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (username, password, settings, progress) VALUES (?, ?, ?, ?)");
      const result = stmt.run(username, password, JSON.stringify({ theme: 'dark' }), JSON.stringify({}));
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json({ success: true, user: { id: user.id, username: user.username, settings: JSON.parse(user.settings), progress: JSON.parse(user.progress) } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/user/save", (req, res) => {
    const { userId, settings, progress } = req.body;
    try {
      const stmt = db.prepare("UPDATE users SET settings = ?, progress = ? WHERE id = ?");
      stmt.run(JSON.stringify(settings), JSON.stringify(progress), userId);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  // Wisp & Bare Server Integration
  server.on("upgrade", (req, socket, head) => {
    if (req.url.startsWith("/wisp/")) {
      wisp(req, socket, head);
    } else if (bare.shouldRoute(req)) {
      bare.routeUpgrade(req, socket, head);
    }
  });

  // Bare Server Integration
  app.use((req, res, next) => {
    if (bare.shouldRoute(req)) {
      bare.routeRequest(req, res);
    } else {
      next();
    }
  });

  // Serve Ultraviolet files
  const uvPath = path.join(__dirname, "node_modules", "@titaniumnetwork-dev", "ultraviolet", "dist");
  app.use("/uv/", (req, res, next) => {
    res.setHeader("Service-Worker-Allowed", "/");
    next();
  }, express.static(uvPath));

  // Serve sw.js from root to allow any scope
  app.get("/sw.js", (req, res) => {
    res.setHeader("Service-Worker-Allowed", "/");
    res.sendFile(path.join(uvPath, "sw.js"));
  });

  // Serve bare-mux files
  const bareMuxPath = path.join(__dirname, "node_modules", "@mercuryworkshop", "bare-mux", "dist");
  app.use("/baremux/", express.static(bareMuxPath));

  // Custom uv.config.js to point to our bare server
  app.get("/uv/uv.config.js", (req, res) => {
    res.type("application/javascript");
    res.send(`
      self.__uv$config = {
        prefix: '/service/',
        encodeUrl: Ultraviolet.codec.xor.encode,
        decodeUrl: Ultraviolet.codec.xor.decode,
        handler: '/uv/uv.handler.js',
        client: '/uv/uv.client.js',
        bundle: '/uv/uv.bundle.js',
        config: '/uv/uv.config.js',
        sw: '/uv/uv.sw.js',
      };
    `);
  });

  // Robust Proxy using http-proxy-middleware (keeping it as fallback or for other uses)
  const proxy = createProxyMiddleware({
    target: "http://localhost:3000", // Placeholder, will be overridden by router
    router: (req) => {
      return req.query.url;
    },
    changeOrigin: true,
    followRedirects: true,
    secure: false,
    pathRewrite: (path, req) => {
      return ""; 
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
        proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
        proxyReq.removeHeader('Origin');
        proxyReq.removeHeader('Referer');
      },
      proxyRes: (proxyRes, req, res) => {
        const headersToRemove = [
          'x-frame-options', 
          'content-security-policy', 
          'content-security-policy-report-only', 
          'cross-origin-resource-policy', 
          'cross-origin-opener-policy',
          'cross-origin-embedder-policy',
          'strict-transport-security',
          'x-content-type-options'
        ];
        headersToRemove.forEach(h => delete proxyRes.headers[h]);
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = '*';
      },
      error: (err, req, res) => {
        console.error("Proxy Error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Proxy failed to reach the target site." });
        }
      }
    }
  });

  // Handle unhandled /service/ requests (Service Worker fallthrough)
  app.get("/service/*", (req, res) => {
    res.status(200).send(`
      <html>
        <body style="background: #020617; color: white; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px;">
          <div style="text-align: center; max-width: 400px;">
            <div style="width: 48px; height: 48px; border: 4px solid rgba(16, 185, 129, 0.1); border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 24px;"></div>
            <h1 style="font-size: 1.75rem; font-weight: 900; margin-bottom: 12px; letter-spacing: -0.02em;">ESTABLISHING CONNECTION</h1>
            <p style="color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 32px;">The secure proxy is initializing. This happens once per session to ensure your connection is encrypted and private.</p>
            <button onclick="location.reload()" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2);">Force Refresh</button>
          </div>
          <style>
            @keyframes spin { to { transform: rotate(360deg); } }
            button:hover { background: #059669; transform: translateY(-2px); }
            button:active { transform: translateY(0); }
          </style>
          <script>
            // Auto-reload every 3 seconds until SW takes over
            setTimeout(() => location.reload(), 3000);
          </script>
        </body>
      </html>
    `);
  });

  // Proxy for large GitHub files to bypass CDN limits
  app.get("/api/v1/github-raw", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send("URL required");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const contentType = response.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (e) {
      console.error("GitHub Proxy Error:", e);
      res.status(500).send("Failed to fetch game file");
    }
  });

  app.use("/api/v1/browse", (req, res, next) => {
    if (!req.query.url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }
    try {
      new URL(req.query.url);
    } catch (e) {
      return res.status(400).json({ error: "Invalid URL provided" });
    }
    return proxy(req, res, next);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
