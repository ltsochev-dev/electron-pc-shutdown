import http from "node:http";
import fs from "fs";
import path from "path";

let server: http.Server | null = null;
let startedAt = 0;

export const PORT = 1339;
// In production, serve from the bundled dist folder
// In development, serve from the source web folder
const isProduction = process.env.NODE_ENV === "production";
const webPath = isProduction
  ? path.join(__dirname, "../dist/web")
  : path.join(__dirname, "web");

const startServer = () => {
  server = http.createServer((req, res) => {
    // In development, serve from the source web folder
    // In production, serve from the built dist folder
    const filePath = isProduction
      ? path.join(webPath, "index.html")
      : path.join(__dirname, "web", "index.html");

    try {
      const content = fs.readFileSync(filePath);
      const mimeType = "text/html";

      res.writeHead(200, {
        "Content-Type": mimeType,
        "Cache-Control": isProduction ? "public, max-age=31536000" : "no-cache",
      });
      res.end(content);
    } catch (error) {
      console.error("Error serving file:", error);
      console.error("Attempted to serve from:", filePath);
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });

  server.listen(PORT, () => {
    startedAt = Date.now();
    console.log(`SPA Server running on http://localhost:${PORT}`);
    console.log(
      `Serving from: ${isProduction ? webPath : path.join(__dirname, "web")}`
    );
  });

  return true;
};

const stopServer = async () => {
  if (!server) return false;

  server.closeAllConnections();

  await server.close();

  server = null;

  return true;
};

const getServer = () => server;
const getServerStartedAt = () => startedAt;

export { startServer, stopServer, getServer, getServerStartedAt };
