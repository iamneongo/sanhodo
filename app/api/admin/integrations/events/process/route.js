import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { processIntegrationEventsBatch } from "../../../../../../lib/restaurant-db";
import { getSupabaseConfig } from "../../../../../../lib/supabase/config";
import { requireAdminApi, unauthorizedResponse } from "../../../../../../lib/supabase/auth";

function parseLimit(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(25, Math.max(1, parsed));
}

function isVercelCronRequest(request) {
  return (request.headers.get("user-agent") || "").toLowerCase().includes("vercel-cron/1.0");
}

function createWorkerClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createSupabaseClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function resolveSupabase(request) {
  if (isVercelCronRequest(request)) {
    return createWorkerClient();
  }

  const context = await requireAdminApi("integrations.sync");
  if (!context) {
    return null;
  }

  return context.supabase;
}

async function processRequest(request) {
  const supabase = await resolveSupabase(request);
  if (!supabase) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));
  const provider = searchParams.get("provider") || "all";
  const maxRetry = Number.parseInt(searchParams.get("maxRetry") || "5", 10);
  const result = await processIntegrationEventsBatch(supabase, {
    limit,
    provider,
    maxRetry: Number.isFinite(maxRetry) ? maxRetry : 5
  });

  return NextResponse.json({ ok: true, data: result });
}

export async function GET(request) {
  try {
    return await processRequest(request);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không chạy được worker đồng bộ" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    return await processRequest(request);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không chạy được worker đồng bộ" }, { status: 500 });
  }
}
