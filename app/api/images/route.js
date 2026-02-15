import { supabase } from "@/lib/supabase/server";
import { Buffer } from "node:buffer";

export async function GET() {
  const { data, error } = await supabase.storage.from("images").list();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const files = data.map((file) => {
    const { data: { publicUrl } } = supabase.storage
      .from("images") 
      .getPublicUrl(file.name);
    return { name: file.name, url: publicUrl };
  });

  return Response.json(files);
}

export async function POST() {
    try {
        const formData = await request.formData;
        const file = formData.get("file");
        if (!file || typeof file === "string") {
            return Response.json({error: "No file provided"}, {status: 400})
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name}`;

        const {data, error} = await supabase.storage.from("images").upload(`${filename}`);
        if (error) throw error;

        return Response.json({success: true, data});
    }
    catch (err) {
        return Response.json({error: err.message}, {status:500});
    }


}
