import { NextResponse } from "next/server";
import { createClient, getUser } from "@/app/lib/supabase/server";

// Records which of the 3 generated variations the user actually picked
// (clicked "Use this" on), so post history can show the post they used
// instead of all 3 every time. See supabase/migrations/0002_selected_variation.sql.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const selectedVariation = body?.selectedVariation;

  if (
    typeof selectedVariation !== "number" ||
    !Number.isInteger(selectedVariation) ||
    selectedVariation < 0 ||
    selectedVariation > 2
  ) {
    return NextResponse.json({ error: "Invalid variation index." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generations")
    .update({ selected_variation: selectedVariation })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Couldn't save your selection." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
