import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Robust Proxy using http-proxy-middleware
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
