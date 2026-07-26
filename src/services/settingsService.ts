import type { BusinessSettings } from "@/types";
import { readJson, writeJson, STORAGE_KEYS } from "./storage";
import { DEFAULT_SETTINGS } from "./seedData";

export const settingsService = {
  get(): BusinessSettings {
    return { ...DEFAULT_SETTINGS, ...readJson<Partial<BusinessSettings>>(STORAGE_KEYS.settings, {}) };
  },
  save(settings: BusinessSettings): BusinessSettings {
    writeJson(STORAGE_KEYS.settings, settings);
    return settings;
  },
  update(patch: Partial<BusinessSettings>): BusinessSettings {
    return settingsService.save({ ...settingsService.get(), ...patch });
  },
  reset(): BusinessSettings {
    return settingsService.save(DEFAULT_SETTINGS);
  },
};