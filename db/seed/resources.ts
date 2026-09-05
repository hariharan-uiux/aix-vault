import { categories, tags as tagCatalog } from "@/lib/taxonomy";
import { domainFromUrl, slugify } from "@/lib/utils";
import type { Resource } from "@/types";

const stamp = "2026-03-12T10:00:00.000Z";

function cat(slug: string) {
  const found = categories.find((item) => item.slug === slug);
  if (!found) throw new Error(`Missing category ${slug}`);
  return found.id;
}

function t(...slugs: string[]) {
  return slugs.map((slug) => {
    const found = tagCatalog.find((item) => item.slug === slug);
    if (!found) throw new Error(`Missing tag ${slug}`);
    return found.id;
  });
}

function resource(
  id: string,
  name: string,
  url: string,
  description: string,
  type: string,
  categoryId: string,
  tagIds: string[],
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
    tagIds,
    saveCount: 0,
  };
}

export const seedResources: Resource[] = [
  resource("figma", "Figma", "https://www.figma.com", "Design and collaboration platform", "tool", cat("design-ui-ux"), t("figma", "collaboration", "prototype", "web")),
  resource("framer", "Framer", "https://www.framer.com", "Design and publish production websites", "tool", cat("design-ui-ux"), t("web", "animation", "prototype")),
  resource("linear", "Linear", "https://linear.app", "Product development and issue tracking", "tool", cat("development-developer-tools"), t("saas", "productivity", "web")),
  resource("notion", "Notion", "https://www.notion.so", "Connected workspace for notes and docs", "tool", cat("development-developer-tools"), t("productivity", "collaboration", "saas")),
  resource("vercel", "Vercel", "https://vercel.com", "Platform for frontend teams and Next.js", "tool", cat("development-developer-tools"), t("web", "saas")),
  resource("github", "GitHub", "https://github.com", "Code hosting and collaboration", "tool", cat("development-open-source"), t("open-source", "collaboration", "web")),
  resource("supabase", "Supabase", "https://supabase.com", "Open source Postgres platform", "tool", cat("development-apis"), t("open-source", "web")),
  resource("shadcn-ui", "shadcn/ui", "https://ui.shadcn.com", "Accessible component primitives for React", "component-library", cat("development-components"), t("react", "components", "open-source", "design-system")),
  resource("radix-ui", "Radix UI", "https://www.radix-ui.com", "Unstyled accessible component primitives", "component-library", cat("development-components"), t("react", "components", "open-source")),
  resource("lucide", "Lucide", "https://lucide.dev", "Open source icon library", "icon-library", cat("design-icons"), t("icons", "open-source", "free")),
  resource("react", "React", "https://react.dev", "Library for web and native user interfaces", "library", cat("development-react"), t("react", "open-source", "web")),
  resource("react-aria", "React Aria", "https://react-spectrum.adobe.com/react-aria/", "Accessible UI primitives for React", "library", cat("development-react"), t("react", "components", "open-source")),
  resource("tailwind", "Tailwind CSS", "https://tailwindcss.com", "Utility-first CSS framework", "library", cat("development-css"), t("css", "open-source", "web")),
  resource("webflow", "Webflow", "https://webflow.com", "Visual website design and CMS", "tool", cat("design-ui-ux"), t("web", "saas")),
  resource("mobbin", "Mobbin", "https://mobbin.com", "Mobile and web design references", "website", cat("design-inspiration"), t("mobile", "web")),
  resource("awwwards", "Awwwards", "https://www.awwwards.com", "Awards for creative web design", "community", cat("design-inspiration"), t("web")),
  resource("arena", "Are.na", "https://www.are.na", "Visual research and collections", "community", cat("design-inspiration"), t("minimal", "research")),
  resource("raindrop", "Raindrop", "https://raindrop.io", "Bookmark manager for saving the web", "tool", cat("development-developer-tools"), t("productivity", "web")),
  resource("savee", "Savee", "https://savee.it", "Visual inspiration bookmarking", "tool", cat("design-inspiration"), t("web")),
  resource("google-fonts", "Google Fonts", "https://fonts.google.com", "Free font library for the web", "font", cat("design-typography"), t("typography", "free", "web")),
  resource("fontshare", "Fontshare", "https://www.fontshare.com", "Quality fonts with free licenses", "font", cat("design-typography"), t("typography", "free")),
  resource("unsplash", "Unsplash", "https://unsplash.com", "Free high-resolution photography", "website", cat("design-assets"), t("photos", "free")),
  resource("coolors", "Coolors", "https://coolors.co", "Color palette generator", "color", cat("design-colors"), t("color", "web", "free")),
  resource("nextjs", "Next.js", "https://nextjs.org", "React framework for production", "library", cat("development-react"), t("react", "web", "open-source")),
  resource("cursor", "Cursor", "https://cursor.com", "AI code editor", "ai-tool", cat("development-ai-tools"), t("ai", "productivity")),
  resource("claude", "Claude", "https://claude.ai", "AI assistant for writing and code", "ai-tool", cat("development-ai-tools"), t("ai", "productivity")),
  resource("chatgpt", "ChatGPT", "https://chatgpt.com", "Conversational AI from OpenAI", "ai-tool", cat("development-ai-tools"), t("ai", "productivity")),
  resource("v0", "v0", "https://v0.dev", "Generative UI from Vercel", "ai-tool", cat("design-ai-design"), t("ai", "react", "components")),
  resource("midjourney", "Midjourney", "https://www.midjourney.com", "Image generation for design exploration", "ai-tool", cat("design-ai-design"), t("ai", "illustration")),
  resource("heroicons", "Heroicons", "https://heroicons.com", "Icons by the makers of Tailwind", "icon-library", cat("design-icons"), t("icons", "open-source", "free")),
  resource("phosphor", "Phosphor Icons", "https://phosphoricons.com", "Flexible icon family for interfaces", "icon-library", cat("design-icons"), t("icons", "open-source", "free")),
  resource("storybook", "Storybook", "https://storybook.js.org", "Frontend workshop for UI components", "tool", cat("development-components"), t("components", "open-source")),
  resource("relume", "Relume", "https://www.relume.io", "Sitemaps, wireframes, and Webflow libraries", "ui-kit", cat("design-ui-ux"), t("web", "figma", "components")),
  resource("untitled-ui", "Untitled UI", "https://www.untitledui.com", "Figma UI kit and design system", "ui-kit", cat("design-design-systems"), t("figma", "design-system")),
  resource("inter", "Inter", "https://rsms.me/inter/", "Typeface designed for computer screens", "font", cat("design-typography"), t("typography", "free", "open-source")),
  resource("geist", "Geist", "https://vercel.com/font", "Typeface by Vercel", "font", cat("design-typography"), t("typography", "web")),
  resource("raycast", "Raycast", "https://www.raycast.com", "Launcher and productivity tool", "tool", cat("development-developer-tools"), t("productivity")),
  resource("astro", "Astro", "https://astro.build", "Web framework for content-driven sites", "library", cat("development-javascript"), t("web", "open-source")),
  resource("mdn", "MDN Web Docs", "https://developer.mozilla.org", "Web platform documentation", "article", cat("development-documentation"), t("web", "free")),
  resource("css-tricks", "CSS-Tricks", "https://css-tricks.com", "Guides and articles for CSS and front-end", "article", cat("development-documentation"), t("css", "web")),
];
