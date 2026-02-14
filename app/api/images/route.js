import { supabase } from "@/lib/supabase/server";

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
