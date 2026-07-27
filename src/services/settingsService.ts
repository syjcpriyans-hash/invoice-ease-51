import type { BusinessSettings } from "@/types";
import { supabase } from "@/lib/supabase";
import { DEFAULT_SETTINGS } from "./seedData";
import { mapSettings, settingsToRow } from "./mappers";

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Please sign in to continue.");
  return data.user.id;
}

export const settingsService = {
  async get(): Promise<BusinessSettings> {
    const ownerId = await currentUserId();
    const { data, error } = await supabase
      .from("business_settings")
      .select("*")
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error) throw error;
    if (data) return mapSettings(data);

    const defaults = { ...DEFAULT_SETTINGS };
    const { data: created, error: createError } = await supabase
      .from("business_settings")
      .insert(settingsToRow(defaults, ownerId))
      .select("*")
      .single();

    if (createError) throw createError;
    return mapSettings(created);
  },

  async save(settings: BusinessSettings): Promise<BusinessSettings> {
    const ownerId = await currentUserId();
    const { data, error } = await supabase
      .from("business_settings")
      .upsert(settingsToRow(settings, ownerId), { onConflict: "owner_id" })
      .select("*")
      .single();

    if (error) throw error;
    return mapSettings(data);
  },
};
