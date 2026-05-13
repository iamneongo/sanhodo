import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_/]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
}

export async function POST(request) {
  const context = await requireAdminApi("menu.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const { searchParams } = new URL(request.url);
    const branchId = sanitizeSegment(searchParams.get("branchId") || "shared");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Không nhận được file ảnh." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Chỉ chấp nhận file ảnh." }, { status: 400 });
    }

    if (file.size > 6 * 1024 * 1024) {
      return NextResponse.json({ error: "Ảnh đang vượt quá 6MB sau khi xử lý." }, { status: 400 });
    }

    const extension = (file.type.split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "");
    const objectPath = `${branchId || "shared"}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await context.supabase.storage
      .from("menu-images")
      .upload(objectPath, bytes, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || "Không upload được ảnh lên storage." },
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
        url: publicUrlData?.publicUrl || ""
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không upload được ảnh món ăn." },
      { status: 500 }
    );
  }
}
