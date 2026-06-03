import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = ["image/", "video/", "application/pdf"];

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_/]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
}

function getExtension(file) {
  const fromName = String(file?.name || "").split(".").pop() || "";
  const fromType = String(file?.type || "").split("/").pop() || "";
  return sanitizeSegment(fromName || fromType || "bin").replace(/\//g, "") || "bin";
}

function isAllowedFile(file) {
  const type = String(file?.type || "");
  return ALLOWED_TYPES.some((prefix) => type === prefix || type.startsWith(prefix));
}

export async function POST(request) {
  const context = await requireAdminApi("media.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const { searchParams } = new URL(request.url);
    const branchId = sanitizeSegment(searchParams.get("branchId") || "shared");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Không nhận được file media." }, { status: 400 });
    }

    if (!isAllowedFile(file)) {
      return NextResponse.json({ error: "Chỉ hỗ trợ ảnh, video hoặc PDF." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File vượt quá 25MB." }, { status: 400 });
    }

    const extension = getExtension(file);
    const objectPath = `media-assets/${branchId || "shared"}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await context.supabase.storage
      .from("menu-images")
      .upload(objectPath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || "Không upload được media lên storage." },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = context.supabase.storage
      .from("menu-images")
      .getPublicUrl(objectPath);

    return NextResponse.json({
      ok: true,
      data: {
        path: objectPath,
        url: publicUrlData?.publicUrl || "",
        fileName: file.name || objectPath.split("/").pop(),
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size || 0
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không upload được media." },
      { status: 500 }
    );
  }
}
