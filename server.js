import { serve } from "bun";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

const PORT = process.env.PORT || 3000;
const DIST_DIR = "./dist";

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;

    // Static file path
    let filePath = join(DIST_DIR, path);

    // If file doesn't exist or is a directory, serve index.html (SPA)
    if (path === "/" || !existsSync(filePath) || (await Bun.file(filePath).size) === 0) {
      filePath = join(DIST_DIR, "index.html");
    }

    return new Response(Bun.file(filePath));
  },
});

console.log(`Web server running on port ${PORT}`);
