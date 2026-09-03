import { NextResponse } from "next/server";
import { createClient, getUser } from "@/app/lib/supabase/server";

type Variation = { text: string; hashtags: string[] };

// Records which of the 3 generated variations the user actually picked
// (clicked "Use this" on), so post history can show the post they used
// instead of all 3 every time. See supabase/migrations/0002_selected_variation.sql.
//
// Optionally also persists edits the user made in the "Edit text" box
// before clicking "Use this one" — without this, an edit only ever lived
// in local component state and vanished on refresh, so history always
// showed the original unedited AI output. Only the *selected* variation's
// edits are persisted (matching the moment the user actually commits to
// it); edits to the other 2, unselected variations are treated as
// exploratory and discarded, same as before this change.
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
  const editedText = body?.text;
  const editedHashtags = body?.hashtags;

  if (
    typeof selectedVariation !== "number" ||
    !Number.isInteger(selectedVariation) ||
    selectedVariation < 0 ||
    selectedVariation > 2
  ) {
    return NextResponse.json({ error: "Invalid variation index." }, { status: 400 });
  }

  const hasEdit = editedText !== undefined || editedHashtags !== undefined;
  if (hasEdit) {
    if (typeof editedText !== "string" || editedText.trim().length === 0) {
      return NextResponse.json({ error: "Invalid post text." }, { status: 400 });
    }
    if (
      !Array.isArray(editedHashtags) ||
      !editedHashtags.every((t) => typeof t === "string")
    ) {
      return NextResponse.json({ error: "Invalid hashtags." }, { status: 400 });
    }
  }

  const supabase = await createClient();

  if (hasEdit) {
    const { data: existing, error: fetchError } = await supabase
      .from("generations")
      .select("variations")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Generation not found." }, { status: 404 });
    }

    const variations = [...(existing.variations as Variation[])];
    variations[selectedVariation] = { text: editedText, hashtags: editedHashtags };

    const { error: updateError } = await supabase
      .from("generations")
      .update({ selected_variation: selectedVariation, variations })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Couldn't save your changes." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

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

// Deletes a generation the user owns, plus its screenshot from storage.
// See supabase/migrations/0007_generations_delete.sql for the RLS policy
// this depends on.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("generations")
    .select("screenshot_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Generation not found." }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("generations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: "Couldn't delete. Try again." }, { status: 500 });
  }

  // Best-effort cleanup — a leftover screenshot file isn't a correctness
  // issue (RLS still scopes it to this user, and it's already
  // unreferenced), just unused storage, so a failure here doesn't fail
  // the whole request.
  if (existing.screenshot_path) {
    const { error: storageError } = await supabase.storage
      .from("screenshots")
      .remove([existing.screenshot_path]);
    if (storageError) {
      console.error("screenshot cleanup failed", storageError);
    }
  }

  return NextResponse.json({ ok: true });
}
