import type { IncomingMessage, ServerResponse } from "node:http";

type JsonResponse = ServerResponse & {
  statusCode: number;
};

// Keep the deployed API adapter self-contained. Vercel compiles functions with
// different module rules than the pnpm workspace used by the Express dev server.
export default function handler(
  request: IncomingMessage,
  response: JsonResponse,
): void {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  response.setHeader("content-type", "application/json; charset=utf-8");

  if (request.method === "GET" && pathname === "/api/healthz") {
    response.statusCode = 200;
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  response.statusCode = 404;
  response.end(JSON.stringify({ error: "Not found" }));
}
