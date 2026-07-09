import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Fellow, FellowLinks } from "@/lib/supabase/types";

export async function getFellowByUsername(username: string): Promise<Fellow | null> {
  const { data } = await supabaseAdmin()
    .from("fellows")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  return (data as unknown as Fellow | null) ?? null;
}

export async function getFellowById(id: string): Promise<Fellow | null> {
  const { data } = await supabaseAdmin()
    .from("fellows")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as Fellow | null) ?? null;
}

export async function listFellows(): Promise<Fellow[]> {
  const { data, error } = await supabaseAdmin()
    .from("fellows")
    .select("*")
    .order("fellow_number", { ascending: true });
  if (error) throw error;
  return (data as unknown as Fellow[]) ?? [];
}

export interface ProfileUpdate {
  bio?: string | null;
  current_startup?: string | null;
  links?: FellowLinks;
  avatar_url?: string | null;
}

export async function updateFellowProfile(
  fellowId: string,
  patch: ProfileUpdate,
): Promise<Fellow> {
  const { data, error } = await supabaseAdmin()
    .from("fellows")
    .update(patch)
    .eq("id", fellowId)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Fellow;
}
