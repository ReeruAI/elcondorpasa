import { z } from "zod";

// Schema for request body (without userId)
export const preferenceBodySchema = z.object({
  contentPreference: z.string().min(1, "Content preference is required"),
  languagePreference: z.string().min(1, "Language preference is required"),
});

// Schema for complete preference data (with userId)
export const preferenceSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  contentPreference: z.string().min(1, "Content preference is required"),
  languagePreference: z.string().min(1, "Language preference is required"),
});

// Type inferences
export type PreferenceBody = z.infer<typeof preferenceBodySchema>;
export type PreferenceInput = z.infer<typeof preferenceSchema>;
