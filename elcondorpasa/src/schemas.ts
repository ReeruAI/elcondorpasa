import { z } from "zod";

export const preferenceSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  contentPreference: z.string().min(1, "Content preference is required"),
  languagePreference: z.string().min(1, "Language preference is required"),
});

// You can use this to infer the type
export type PreferenceInput = z.infer<typeof preferenceSchema>;
