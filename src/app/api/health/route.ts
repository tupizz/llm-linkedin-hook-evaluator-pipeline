import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Health check",
    built_at: process.env.BUILD_AT || "Not set",
    timestamp: new Date().toISOString(),
  });
}
