import { NextResponse } from "next/server";

async function nextcloudRequest(method, url, username, password, body = null, headers = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
      ...headers,
    },
    body,
  });
  return res;
}

// GET → Ordner auflisten
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ncUrl = searchParams.get("url");
}