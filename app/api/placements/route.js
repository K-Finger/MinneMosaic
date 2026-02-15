import { supabase } from "@/lib/supabase/server";
import { Buffer } from "node:buffer";

export async function GET() {
  const { data, error } = await supabase.from("placements").select("*");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

// MASS DELETE FUNCTION FOR TESTING
export async function DELETE() {
    try {
        const { data: rows, error: selectErr } = await supabase.from("placements").select("url");
        if (selectErr) throw selectErr;

        const fileNames = rows.map((r) => r.url.split("/").pop()).filter(Boolean);
        if (fileNames.length > 0) {
            const { error: storageErr } = await supabase.storage.from("images").remove(fileNames);
            if (storageErr) throw storageErr;
        }

        const { error: deleteErr } = await supabase.from("placements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (deleteErr) throw deleteErr;

        return Response.json({ deleted: fileNames.length });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const x = parseInt(formData.get("x"));
        const y = parseInt(formData.get("y"));
        const w = parseInt(formData.get("w"));
        const h = parseInt(formData.get("h"));
        const caption = formData.get("caption") || "";

        if (!file || typeof file === "string") {
            return Response.json({error: "No file provided"}, {status: 400})
        }
        if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) {
            return Response.json({error: "Missing x, y, w, or h"}, {status: 400})
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name}`;

        const { error: uploadErr } = await supabase.storage.from("images").upload(fileName, buffer, {
            contentType: file.type,
        });
        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(fileName);

        const { data: placement, error: insertErr } = await supabase
            .from("placements")
            .insert({ url: publicUrl, x, y, w, h, caption })
            .select()
            .single();

        if (insertErr) {
            if (insertErr.code === "23P01") {
                return Response.json({error: "Overlaps an existing tile"}, {status: 409});
            }
            throw insertErr;
        }

        return Response.json(placement, {status: 201});
    }
    catch (err) {
        return Response.json({error: err.message}, {status:500});
    }
}
