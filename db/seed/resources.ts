import { categories } from "@/lib/taxonomy";
import { domainFromUrl, slugify } from "@/lib/utils";
import type { Resource } from "@/types";

const stamp = "2026-03-12T10:00:00.000Z";

function cat(slug: string) {
  const found = categories.find((item) => item.slug === slug);
  if (!found) throw new Error(`Missing category ${slug}`);
  return found.id;
}

function resource(
  id: string,
  name: string,
  url: string,
  description: string,
  type: string,
  categoryId: string,
  createdAt = stamp,
): Resource {
  return {
    id,
    name,
    slug: slugify(name),
    description,
    url,
    domain: domainFromUrl(url),
    iconUrl: null,
    type,
    categoryId,
    createdBy: null,
    createdAt,
    updatedAt: createdAt,
    isPublic: true,
    saveCount: 0,
    upvotes: 0,
  };
}

export const seedResources: Resource[] = [
  resource("figma", "Figma", "https://www.figma.com", "Design and collaboration platform", "tool", cat("design")),
  resource("framer", "Framer", "https://www.framer.com", "Design and publish production websites", "tool", cat("design")),
  resource("linear", "Linear", "https://linear.app", "Product development and issue tracking", "tool", cat("development")),
  resource("notion", "Notion", "https://www.notion.so", "Connected workspace for notes and docs", "tool", cat("development")),
  resource("vercel", "Vercel", "https://vercel.com", "Platform for frontend teams and Next.js", "tool", cat("development")),
  resource("github", "GitHub", "https://github.com", "Code hosting and collaboration", "tool", cat("development-open-source")),
  resource("supabase", "Supabase", "https://supabase.com", "Open source Postgres platform", "tool", cat("development-apis")),
  resource("shadcn-ui", "shadcn/ui", "https://ui.shadcn.com", "Accessible component primitives for React", "component-library", cat("development")),
  resource("radix-ui", "Radix UI", "https://www.radix-ui.com", "Unstyled accessible component primitives", "component-library", cat("development")),
  resource("lucide", "Lucide", "https://lucide.dev", "Open source icon library", "icon-library", cat("design")),
  resource("react", "React", "https://react.dev", "Library for web and native user interfaces", "library", cat("development")),
  resource("react-aria", "React Aria", "https://react-spectrum.adobe.com/react-aria/", "Accessible UI primitives for React", "library", cat("development")),
  resource("tailwind", "Tailwind CSS", "https://tailwindcss.com", "Utility-first CSS framework", "library", cat("development")),
  resource("webflow", "Webflow", "https://webflow.com", "Visual website design and CMS", "tool", cat("design")),
  resource("mobbin", "Mobbin", "https://mobbin.com", "Mobile and web design references", "website", cat("design")),
  resource("awwwards", "Awwwards", "https://www.awwwards.com", "Awards for creative web design", "community", cat("design")),
  resource("arena", "Are.na", "https://www.are.na", "Visual research and collections", "community", cat("design")),
  resource("raindrop", "Raindrop", "https://raindrop.io", "Bookmark manager for saving the web", "tool", cat("development")),
  resource("savee", "Savee", "https://savee.it", "Visual inspiration bookmarking", "tool", cat("design")),
  resource("google-fonts", "Google Fonts", "https://fonts.google.com", "Free font library for the web", "font", cat("design-typography")),
  resource("fontshare", "Fontshare", "https://www.fontshare.com", "Quality fonts with free licenses", "font", cat("design-typography")),
  resource("unsplash", "Unsplash", "https://unsplash.com", "Free high-resolution photography", "website", cat("design")),
  resource("coolors", "Coolors", "https://coolors.co", "Color palette generator", "color", cat("design")),
  resource("nextjs", "Next.js", "https://nextjs.org", "React framework for production", "library", cat("development")),
  resource("cursor", "Cursor", "https://cursor.com", "AI code editor", "ai-tool", cat("development")),
  resource("claude", "Claude", "https://claude.ai", "AI assistant for writing and code", "ai-tool", cat("development")),
  resource("chatgpt", "ChatGPT", "https://chatgpt.com", "Conversational AI from OpenAI", "ai-tool", cat("development")),
  resource("v0", "v0", "https://v0.dev", "Generative UI from Vercel", "ai-tool", cat("design")),
  resource("midjourney", "Midjourney", "https://www.midjourney.com", "Image generation for design exploration", "ai-tool", cat("design")),
  resource("heroicons", "Heroicons", "https://heroicons.com", "Icons by the makers of Tailwind", "icon-library", cat("design")),
  resource("phosphor", "Phosphor Icons", "https://phosphoricons.com", "Flexible icon family for interfaces", "icon-library", cat("design")),
  resource("storybook", "Storybook", "https://storybook.js.org", "Frontend workshop for UI components", "tool", cat("development")),
  resource("relume", "Relume", "https://www.relume.io", "Sitemaps, wireframes, and Webflow libraries", "ui-kit", cat("design")),
  resource("untitled-ui", "Untitled UI", "https://www.untitledui.com", "Figma UI kit and design system", "ui-kit", cat("design")),
  resource("inter", "Inter", "https://rsms.me/inter/", "Typeface designed for computer screens", "font", cat("design-typography")),
  resource("geist", "Geist", "https://vercel.com/font", "Typeface by Vercel", "font", cat("design-typography")),
  resource("raycast", "Raycast", "https://www.raycast.com", "Launcher and productivity tool", "tool", cat("development")),
  resource("astro", "Astro", "https://astro.build", "Web framework for content-driven sites", "library", cat("development")),
  resource("mdn", "MDN Web Docs", "https://developer.mozilla.org", "Web platform documentation", "article", cat("development")),
  resource("css-tricks", "CSS-Tricks", "https://css-tricks.com", "Guides and articles for CSS and front-end", "article", cat("development")),
];
