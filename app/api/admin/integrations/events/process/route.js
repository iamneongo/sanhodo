import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { processIntegrationEventsBatch } from "../../../../../../lib/restaurant-db";
import { hasSupabaseServiceRoleConfig, getSupabaseConfig, getSupabaseServiceRoleKey } from "../../../../../../lib/supabase/config";
import { requireAdminApi, unauthorizedResponse } from "../../../../../../lib/supabase/auth";

function parseLimit(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(25, Math.max(1, parsed));
}

function hasWorkerSecret(request) {
  const expectedSecrets = [process.env.INTEGRATION_WORKER_SECRET, process.env.CRON_SECRET]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  if (!expectedSecrets.length) return false;

  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret") || "";
  return expectedSecrets.includes(bearer) || expectedSecrets.includes(querySecret);
}

function createServiceRoleClient() {
  const { url } = getSupabaseConfig();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function resolveSupabase(request) {
  if (hasWorkerSecret(request)) {
    if (!hasSupabaseServiceRoleConfig()) {
      throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY để chạy worker đồng bộ.");
    }

    return createServiceRoleClient();
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
