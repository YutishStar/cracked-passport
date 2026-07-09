import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Application, ApplicationStatus, FellowLinks } from "@/lib/supabase/types";

export interface NewApplication {
  name: string;
  email: string;
  github_url?: string | null;
  links?: FellowLinks;
  answers?: Record<string, string>;
}

/** Insert a public application. Throws on duplicate email (unique constraint). */
export async function createApplication(input: NewApplication): Promise<Application> {
  const { data, error } = await supabaseAdmin()
    .from("applications")
    .insert({
      name: input.name,
      email: input.email.toLowerCase(),
      github_url: input.github_url ?? null,
      links: input.links ?? {},
      answers: input.answers ?? {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Application;
}

export async function listApplications(
  status?: ApplicationStatus,
): Promise<Application[]> {
  let q = supabaseAdmin()
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as Application[]) ?? [];
}

export async function getApplication(id: string): Promise<Application | null> {
  const { data } = await supabaseAdmin()
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as Application | null) ?? null;
}
