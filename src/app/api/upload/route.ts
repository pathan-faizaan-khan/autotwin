import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "chat-attachments";
    const userId = formData.get("userId") as string | null;

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const storagePath = `${userId}/${fileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(storagePath, file, { contentType: file.type });

    if (error) {
      console.error("[upload]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl, path: data.path, name: file.name });
  } catch (err: any) {
    console.error("[upload]", err.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
