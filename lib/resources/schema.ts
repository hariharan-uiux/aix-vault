import { z } from "zod";

export const PAGE_SIZE = 40;

function isValidUrl(value: string) {
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const parsed = new URL(withProtocol);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const resourceInputSchema = z.object({
  url: z.string().trim().refine(isValidUrl, "Enter a valid URL."),
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim().max(280).default(""),
  categoryId: z.string().min(1, "Choose a category."),
  type: z.string().min(1, "Choose a type."),
  tags: z.array(z.string()).default([]),
  collectionId: z.string().optional(),
});

export type ResourceInput = z.infer<typeof resourceInputSchema>;
