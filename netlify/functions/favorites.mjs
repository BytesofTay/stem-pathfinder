import { randomBytes } from "node:crypto";
import { getStore } from "@netlify/blobs";

const STORE = getStore("stem-pathfinder-favorites");
const COOKIE_NAME = "stem_visitor";

function makeResponse(status, payload, visitorId) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  if (visitorId) {
    headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${visitorId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`,
    );
  }
  return new Response(JSON.stringify(payload), { status, headers });
}

function getVisitorId(request) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.match(/(?:^|;\s*)stem_visitor=([a-f0-9]{32})(?:;|$)/)?.[1] || null;
}

export default async function favorites(request) {
  if (request.method !== "GET" && request.method !== "PUT") {
    return makeResponse(405, { error: "Method not allowed" });
  }

  const visitorId = getVisitorId(request) || randomBytes(16).toString("hex");

  if (request.method === "GET") {
    try {
      const saved = await STORE.get(visitorId, { type: "json", consistency: "strong" });
      const favorites = Array.isArray(saved?.favorites) ? saved.favorites : [];
      return makeResponse(200, { favorites }, visitorId);
    } catch {
      return makeResponse(503, { error: "Saved schools are temporarily unavailable" }, visitorId);
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return makeResponse(400, { error: "Invalid JSON" }, visitorId);
  }
  if (
    !Array.isArray(body?.favorites) ||
    body.favorites.length > 180 ||
    body.favorites.some((name) => typeof name !== "string" || name.length > 200)
  ) {
    return makeResponse(400, { error: "favorites must be an array of up to 180 school names" }, visitorId);
  }

  const favorites = [...new Set(body.favorites)];
  try {
    await STORE.setJSON(visitorId, { favorites });
    return makeResponse(200, { favorites }, visitorId);
  } catch {
    return makeResponse(503, { error: "Saved schools are temporarily unavailable" }, visitorId);
  }
}
