import { serve } from "bun";
import { join } from "path";
import { existsSync } from "fs";

const PORT = process.env.PORT || 5903;
const DIST_DIR = "./dist";
const US_VISITOR_HEADER = "x-kf-us-visitor";
const US_STATE_HEADER = "x-kf-state";

function logUsPageView(req, url) {
  const acceptsHtml = req.headers.get("accept")?.includes("text/html");
  const isUsVisitor = req.headers.get(US_VISITOR_HEADER) === "1";

  // Log document requests only. Static assets otherwise produce several records
  // for each page view.
  if (req.method !== "GET" || !acceptsHtml || !isUsVisitor) {
    return;
  }

  console.log(JSON.stringify({
    event: "us_visitor_page_view",
    timestamp: new Date().toISOString(),
    ip: req.headers.get("cf-connecting-ip"),
    state: req.headers.get(US_STATE_HEADER),
    path: url.pathname,
    referrer: req.headers.get("referer"),
  }));
}

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    logUsPageView(req, url);
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
