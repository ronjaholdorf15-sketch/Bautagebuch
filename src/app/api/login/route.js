import { NextResponse } from "next/server";

export async function POST(req) {
  const { url, username, password } = await req.json();

  if (!url || !username || !password) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  const res = await fetch(url, {
    method: "PROPFIND",
    headers: {
      Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
      Depth: "0",
    },
  });

  if (res.ok) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ success: false, error: "Login fehlgeschlagen" }, { status: 401 });
  }
}
