import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Improved Proxy Route
  app.all("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send("URL is required");
    }

    try {
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        params: req.query,
        responseType: 'arraybuffer',
        maxRedirects: 5,
        validateStatus: () => true,
        headers: {
          'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
          'Accept': req.headers['accept'] || '*/*',
          'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
          'Cookie': req.headers['cookie'] || '',
          'Referer': targetUrl,
        }
      });
      
      const finalUrl = response.request.res.responseUrl || targetUrl;
      const contentType = response.headers['content-type'] || 'text/html';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Handle set-cookie headers from target
      if (response.headers['set-cookie']) {
        res.setHeader('Set-Cookie', response.headers['set-cookie']);
      }
      
      // Strip security headers that prevent iframing
      const headersToRemove = ['x-frame-options', 'content-security-policy', 'content-security-policy-report-only', 'cross-origin-resource-policy', 'strict-transport-security'];
      
      let data = response.data;
      if (contentType.includes('text/html')) {
        const html = data.toString();
        const baseTag = `<base href="${finalUrl}">`;
        if (html.includes('<head>')) {
          data = html.replace('<head>', `<head>${baseTag}`);
        } else if (html.includes('<html>')) {
          data = html.replace('<html>', `<html><head>${baseTag}</head>`);
        } else {
          data = baseTag + html;
        }
      }

      // Basic header passthrough
      const headersToPass = ['cache-control', 'content-language', 'expires', 'last-modified', 'pragma'];
      headersToPass.forEach(h => {
        if (response.headers[h] && !headersToRemove.includes(h)) {
          res.setHeader(h, response.headers[h]);
        }
      });

      res.status(response.status).send(data);
    } catch (error) {
      res.status(500).send("Proxy Error: " + error.message);
    }
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
