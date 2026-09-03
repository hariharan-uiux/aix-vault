"use client";

import { useVault } from "@/lib/vault/store";
import { cn, faviconUrl } from "@/lib/utils";
import { Bookmark, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function MiniAppIcon({
  name,
  domain,
  iconUrl,
}: {
  name: string;
  domain?: string;
  iconUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const src = iconUrl || (domain ? faviconUrl(domain) : null);
  const isLoaded = loadedSrc === src;

  return (
    <div className="relative flex size-6 sm:size-7 items-center justify-center rounded-xl border border-black/10 bg-white overflow-hidden p-1 transition-all duration-300">
      {src && !failed ? (
        <>
          {!isLoaded && (
            <span className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-zinc-800/50 uppercase tracking-tight select-none">
              {name.slice(0, 2)}
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn(
              "size-full rounded-lg object-contain bg-white transition-opacity duration-200",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setLoadedSrc(src)}
            onError={() => setFailed(true)}
          />
        </>
      ) : (
        <span className="text-[9px] sm:text-[10px] font-bold text-zinc-800 uppercase tracking-tight">
          {name.slice(0, 2)}
        </span>
      )}
    </div>
  );
}

function RealDarkFolder({
  id,
  active = false,
  count = 0,
  items = [],
}: {
  id: string;
  active?: boolean;
  count?: number;
  items?: Array<{ name: string; domain?: string; iconUrl?: string | null }>;
}) {
  const { theme } = useVault();
  const isDark = theme === "dark";

  const defaultFallbacks = [
    { name: "Code", domain: "github.com" },
    { name: "Design", domain: "figma.com" },
    { name: "Cloud", domain: "vercel.com" },
  ];

  const hasItems = count > 0 || items.length > 0;

  const displayItems = [
    items[0] || defaultFallbacks[0],
    items[1] || defaultFallbacks[1],
    items[2] || defaultFallbacks[2],
  ];

  const backGradId = `realFolderBack-${id}-${isDark ? "dark" : "light"}`;
  const frontGradId = `realFolderFront-${id}-${isDark ? "dark" : "light"}`;
  const rimGradId = `realFolderRim-${id}-${isDark ? "dark" : "light"}`;

  return (
    <div className="relative flex h-14 w-[74px] sm:h-16 sm:w-[82px] items-center justify-center">
      {/* 1. Back folder plate */}
      <svg
        viewBox="0 0 84 64"
        className="absolute inset-0 size-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={backGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            {isDark ? (
              <>
                <stop offset="0%" stopColor="#2e313a" />
                <stop offset="100%" stopColor="#14161a" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#f3f5f8" />
                <stop offset="100%" stopColor="#e4e8ef" />
              </>
            )}
          </linearGradient>

          <linearGradient id={frontGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            {isDark ? (
              <>
                <stop offset="0%" stopColor={active ? "#3e4350" : "#323640"} />
                <stop offset="25%" stopColor={active ? "#2b2e37" : "#23262d"} />
                <stop offset="100%" stopColor={active ? "#191b21" : "#131418"} />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#ffffff" />
                <stop offset="100%" stopColor={active ? "#edf1f7" : "#f4f6fa"} />
              </>
            )}
          </linearGradient>

          <linearGradient id={rimGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            {isDark ? (
              <>
                <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                <stop offset="35%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="rgba(255,255,255,1)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
                <stop offset="100%" stopColor="rgba(255,255,255,1)" />
              </>
            )}
          </linearGradient>
        </defs>

        {/* Back folder with top-left tab */}
        <path
          d="M 8 16 C 8 13.5 10 11.5 12.5 11.5 L 29 11.5 C 32 11.5 34.5 13 36 15 L 38.5 18 C 40 19.5 42 20 44 20 L 71.5 20 C 74 20 76 22 76 24.5 L 76 52 C 76 54.5 74 56.5 71.5 56.5 L 12.5 56.5 C 10 56.5 8 54.5 8 52 Z"
          fill={`url(#${backGradId})`}
          stroke={isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)"}
          strokeWidth="1"
          className="transition-all duration-300"
        />
      </svg>

      {/* 2. App Icons Layer: Peeks out in initial state, low-profile subtle pop-up on hover */}
      {hasItems && (
        <div className="absolute inset-x-0 top-1 z-10 flex items-center justify-center pointer-events-none">
          {/* Left App Icon */}
          <div
            className={cn(
              "absolute transition-all duration-300 ease-out",
              active
                ? "-translate-y-1.5 -translate-x-3.5 -rotate-6 scale-90 opacity-100"
                : "translate-y-2 -translate-x-3 -rotate-6 scale-90 opacity-90 group-hover:-translate-y-1.5 group-hover:-translate-x-3.5 group-hover:-rotate-6 group-hover:scale-90 group-hover:opacity-100",
            )}
          >
            <MiniAppIcon
              name={displayItems[0].name}
              domain={displayItems[0].domain}
              iconUrl={displayItems[0].iconUrl}
            />
          </div>

          {/* Center App Icon (floats slightly above the folder) */}
          <div
            className={cn(
              "absolute z-10 transition-all duration-300 ease-out",
              active
                ? "-translate-y-2 scale-95 rotate-0 opacity-100"
                : "translate-y-1.5 translate-x-0 rotate-0 scale-95 opacity-100 group-hover:-translate-y-2 group-hover:scale-95 group-hover:opacity-100",
            )}
          >
            <MiniAppIcon
              name={displayItems[1].name}
              domain={displayItems[1].domain}
              iconUrl={displayItems[1].iconUrl}
            />
          </div>

          {/* Right App Icon */}
          <div
            className={cn(
              "absolute transition-all duration-300 ease-out",
              active
                ? "-translate-y-1.5 translate-x-3.5 rotate-6 scale-90 opacity-100"
                : "translate-y-2 translate-x-3 rotate-6 scale-90 opacity-90 group-hover:-translate-y-1.5 group-hover:translate-x-3.5 group-hover:rotate-6 group-hover:scale-90 group-hover:opacity-100",
            )}
          >
            <MiniAppIcon
              name={displayItems[2].name}
              domain={displayItems[2].domain}
              iconUrl={displayItems[2].iconUrl}
            />
          </div>
        </div>
      )}

      {/* 3. Front Flap SVG (in front of icons, z-20) */}
      <svg
        viewBox="0 0 84 64"
        className="absolute inset-0 size-full pointer-events-none z-20 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g
          style={{ transformBox: "fill-box", transformOrigin: "bottom center" }}
          className={cn(
            "transition-all duration-300 ease-out",
            active ? "translate-y-0.5 scale-y-[0.96]" : "group-hover:translate-y-1 group-hover:scale-y-[0.94]",
          )}
        >
          <path
            d="M 6 25 C 6 22.5 8 20.5 10.5 20.5 L 73.5 20.5 C 76 20.5 78 22.5 78 25 L 76.5 53 C 76.5 55.5 74.5 57.5 72 57.5 L 12 57.5 C 9.5 57.5 7.5 55.5 7.5 53 Z"
            fill={`url(#${frontGradId})`}
            stroke={
              isDark
                ? (active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.16)")
                : (active ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.12)")
            }
            strokeWidth={active ? "1.2" : "1"}
            className={cn(
              "transition-colors duration-300",
              isDark ? "group-hover:stroke-white/30" : "group-hover:stroke-black/25",
            )}
          />

          {/* Top rim specular highlight line */}
          <line
            x1="11"
            y1="21.5"
            x2="73"
            y2="21.5"
            stroke={`url(#${rimGradId})`}
            strokeWidth="1"
            strokeLinecap="round"
            className={cn(
              "transition-all duration-300",
              isDark ? "group-hover:stroke-white/90" : "group-hover:stroke-white",
            )}
          />

          {/* Front cover center clasp / embossed detail */}
          <rect
            x="37"
            y="26"
            width="10"
            height="2"
            rx="1"
            fill={
              isDark
                ? (active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)")
                : (active ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.1)")
            }
            className={cn(
              "transition-colors duration-300",
              isDark ? "group-hover:fill-white/40" : "group-hover:fill-black/20",
            )}
          />
        </g>
      </svg>

      {/* 4. Count Badge (z-30) */}
      {count > 0 && (
        <span
          className={cn(
            "absolute -top-1 -right-1 z-30 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-mono font-semibold border bg-white text-zinc-900 border-black/15 transition-all duration-300",
            active
              ? "border-black/40 scale-105"
              : "group-hover:scale-110 group-hover:border-black/30",
          )}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function NewFolderIllustration() {
  const { theme } = useVault();
  const isDark = theme === "dark";

  const backGradId = `newFolderBack-${isDark ? "dark" : "light"}`;
  const frontGradId = `newFolderFront-${isDark ? "dark" : "light"}`;

  return (
    <div className="relative flex h-14 w-[74px] sm:h-16 sm:w-[82px] items-center justify-center">
      {/* Folder base and flap SVG */}
      <svg
        viewBox="0 0 84 64"
        className="absolute inset-0 size-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={backGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            {isDark ? (
              <>
                <stop offset="0%" stopColor="#282b34" />
                <stop offset="100%" stopColor="#15171d" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#f4f6fa" />
                <stop offset="100%" stopColor="#e5e9f0" />
              </>
            )}
          </linearGradient>

          <linearGradient id={frontGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            {isDark ? (
              <>
                <stop offset="0%" stopColor="#22242c" />
                <stop offset="100%" stopColor="#121318" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f0f3f8" />
              </>
            )}
          </linearGradient>
        </defs>

        {/* Back folder plate with tab */}
        <path
          d="M 8 16 C 8 13.5 10 11.5 12.5 11.5 L 29 11.5 C 32 11.5 34.5 13 36 15 L 38.5 18 C 40 19.5 42 20 44 20 L 71.5 20 C 74 20 76 22 76 24.5 L 76 52 C 76 54.5 74 56.5 71.5 56.5 L 12.5 56.5 C 10 56.5 8 54.5 8 52 Z"
          fill={`url(#${backGradId})`}
          stroke={isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)"}
          strokeWidth="1.2"
          strokeDasharray="3.5 2.5"
          className="transition-all duration-300 group-hover:stroke-black/35 dark:group-hover:stroke-white/40"
        />

        {/* Front flap with dashed styling and subtle interactive motion */}
        <path
          d="M 6 25 C 6 22.5 8 20.5 10.5 20.5 L 73.5 20.5 C 76 20.5 78 22.5 78 25 L 76.5 53 C 76.5 55.5 74.5 57.5 72 57.5 L 12 57.5 C 9.5 57.5 7.5 55.5 7.5 53 Z"
          fill={`url(#${frontGradId})`}
          stroke={isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)"}
          strokeWidth="1.2"
          strokeDasharray="3.5 2.5"
          className="transition-all duration-300 group-hover:stroke-black/35 dark:group-hover:stroke-white/40"
        />
      </svg>

      {/* High-contrast Plus icon in center: dark badge in light mode, light badge in dark mode */}
      <div className="relative z-30 flex size-7 sm:size-8 items-center justify-center rounded-xl bg-foreground text-background shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
        <Plus size={16} strokeWidth={2.5} />
      </div>
    </div>
  );
}

export function Sidebar() {
  const {
    navigation,
    setNavigation,
    collections,
    createCollection,
    sidebarOpen,
    setSidebarOpen,
    savedIds,
    collectionResourceIds,
    resources,
    deleteCollection,
    renameCollection,
    theme,
    isAdmin,
  } = useVault();
  const isDark = theme === "dark";

  const barRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    folderId: string;
    folderName: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!sidebarOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAdding(false);
      setNewName("");
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (contextMenu) {
          setContextMenu(null);
          return;
        }
        if (editingFolderId) {
          setEditingFolderId(null);
          setEditName("");
          return;
        }
        if (isAdding) {
          setIsAdding(false);
          setNewName("");
          return;
        }
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, setSidebarOpen, isAdding, contextMenu, editingFolderId]);


  useEffect(() => {
    if (editingFolderId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [editingFolderId]);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [isAdding]);

  const handleCreateCollection = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setIsAdding(false);
      setNewName("");
      return;
    }
    const created = createCollection(trimmed);
    setNewName("");
    setIsAdding(false);
    if (created) {
      setNavigation({ kind: "collection", collectionId: created.id });
    }
  };

  const handleRenameSubmit = (id: string, name: string) => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== collections.find((c) => c.id === id)?.name) {
      renameCollection(id, trimmed);
    }
    setEditingFolderId(null);
    setEditName("");
  };

  const handleDeleteFolder = (id: string) => {
    deleteCollection(id);
    setContextMenu(null);
  };

  return (
    <>
      {/* Backdrop overlay for outside click */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/25 dark:bg-black/50 backdrop-blur-[2px] transition-all duration-200",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Floating Folders Bar / Dock with Frosted Glass Translucency */}
      <div
        ref={barRef}
        role="dialog"
        aria-label="Collections and Saved Navigation"
        className={cn(
          "fixed left-1/2 z-40 w-[calc(100vw-1.5rem)] max-w-2xl sm:max-w-3xl md:max-w-4xl -translate-x-1/2 rounded-2xl border border-border/80 dark:border-white/10 bg-background/85 dark:bg-background/85 backdrop-blur-2xl p-3 sm:p-4 shadow-2xl shadow-black/15 dark:shadow-black/60 transition-all duration-200 ease-out",
          // Open from bottom (above the bottom dock) on both mobile & desktop
          "top-auto bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]",
          sidebarOpen
            ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
            : "translate-y-3 opacity-0 scale-[0.98] pointer-events-none",
        )}
      >
        {/* Top Header Row: Folders Title & Count on Left, Saved Button & Close on Right */}
        <div className="flex items-center justify-between gap-3">
          {/* Folders Section Title & Count */}
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[13px] font-semibold text-foreground tracking-tight">
              Folders
            </span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-mono border transition-colors",
                isDark
                  ? "bg-white/10 text-zinc-300 border-white/10"
                  : "bg-black/5 text-zinc-600 border-black/10",
              )}
            >
              {collections.length}
            </span>
          </div>

          {/* Right controls: Saved icon & close icon */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Close button (follows light & dark theme) */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border shadow-xs transition-colors cursor-pointer",
                isDark
                  ? "bg-[#181a20] border-white/15 text-zinc-300 hover:text-white hover:bg-[#22252e]"
                  : "bg-white border-black/10 text-zinc-700 hover:text-black hover:bg-zinc-100",
              )}
              aria-label="Close collections bar"
              title="Close (Esc)"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Divider below Header */}
        <div className="my-2.5 sm:my-3 h-px w-full bg-black/10 dark:bg-white/12" />

        {/* Realistic Folder Illustrations Grid: shows 6 folders on first line, wraps new folders to second line */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-6 pt-4 sm:pt-5 pb-2 px-1 max-h-[70vh] max-sm:max-h-[min(380px,50vh)] overflow-y-auto no-scrollbar">
          {collections.map((collection) => {
            const active =
              navigation.kind === "collection" &&
              navigation.collectionId === collection.id;
            const resourceIds = collectionResourceIds(collection.id);
            const count = resourceIds.length;
            const collectionItems = resources.filter((r) =>
              resourceIds.includes(r.id),
            );

            return (
              <div
                key={collection.id}
                onContextMenu={(e) => {
                  if (!isAdmin) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const x = Math.max(12, Math.min(e.clientX, window.innerWidth - 170));
                  const y = Math.max(12, Math.min(e.clientY, window.innerHeight - 120));
                  setContextMenu({
                    folderId: collection.id,
                    folderName: collection.name,
                    x,
                    y,
                  });
                }}
                className="group relative flex w-full flex-col items-center gap-1.5 p-1 sm:p-2 text-center"
              >
                {/* Folder icon button */}
                <button
                  type="button"
                  onClick={() => {
                    if (editingFolderId !== collection.id) {
                      setNavigation({ kind: "collection", collectionId: collection.id });
                    }
                  }}
                  className="transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.04] focus:outline-none cursor-pointer"
                  title={`${collection.name} (${count} ${count === 1 ? "resource" : "resources"})${isAdmin ? " — Right-click to edit" : ""}`}
                >
                  <RealDarkFolder
                    id={collection.id}
                    active={active}
                    count={count}
                    items={collectionItems}
                  />
                </button>

                {/* Folder title or inline rename input */}
                {editingFolderId === collection.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRenameSubmit(collection.id, editName);
                    }}
                    className="w-full flex justify-center m-0 p-0"
                  >
                    <input
                      ref={renameInputRef}
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.stopPropagation();
                          setEditingFolderId(null);
                          setEditName("");
                        }
                      }}
                      onBlur={() => handleRenameSubmit(collection.id, editName)}
                      placeholder="Folder name..."
                      style={{
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        boxShadow: "none",
                        WebkitAppearance: "none",
                        appearance: "none",
                      }}
                      className="w-full max-w-[88px] sm:max-w-[96px] border-none bg-transparent p-0 text-center text-[12px] font-medium leading-tight text-foreground placeholder:text-muted-foreground/60 shadow-none outline-none ring-0 focus:border-none focus:outline-none focus:ring-0 focus:shadow-none caret-foreground"
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setNavigation({ kind: "collection", collectionId: collection.id });
                    }}
                    className="flex flex-col items-center gap-0.5 w-full cursor-pointer focus:outline-none"
                  >
                    <span
                      className={cn(
                        "text-[12px] font-medium leading-tight line-clamp-2 max-w-full transition-all duration-300",
                        active
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground group-hover:text-foreground group-hover:translate-y-0.5",
                      )}
                    >
                      {collection.name}
                    </span>
                    {active && (
                      <span className="size-1 rounded-full bg-foreground transition-all" />
                    )}
                  </button>
                )}
              </div>
            );
          })}

          {/* New folder item: inline input when adding, or + New Folder button (Admin Only) */}
          {isAdmin && (
            <div className="group flex w-full flex-col items-center gap-1.5 p-1 sm:p-2 text-center">
              <button
                type="button"
                onClick={() => {
                  if (!isAdding) {
                    setNewName("");
                    setIsAdding(true);
                  }
                }}
                className="transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.04] focus:outline-none cursor-pointer"
                title="Create new collection folder"
              >
                <NewFolderIllustration />
              </button>

              {isAdding ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateCollection(newName);
                  }}
                  className="w-full flex justify-center m-0 p-0"
                >
                  <input
                    ref={inputRef}
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setIsAdding(false);
                        setNewName("");
                      }
                    }}
                    onBlur={() => {
                      if (newName.trim()) {
                        handleCreateCollection(newName);
                      } else {
                        setIsAdding(false);
                      }
                    }}
                    placeholder="New folder..."
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      boxShadow: "none",
                      WebkitAppearance: "none",
                      appearance: "none",
                    }}
                    className="w-full max-w-[88px] sm:max-w-[96px] border-none bg-transparent p-0 text-center text-[12px] font-medium leading-tight text-foreground placeholder:text-muted-foreground/60 shadow-none outline-none ring-0 focus:border-none focus:outline-none focus:ring-0 focus:shadow-none caret-foreground"
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setNewName("");
                    setIsAdding(true);
                  }}
                  className="text-[12px] font-medium text-muted-foreground group-hover:text-foreground group-hover:translate-y-0.5 transition-all duration-300 focus:outline-none cursor-pointer"
                  title="Create new collection folder"
                >
                  + New Folder
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right-click Context Menu for Folders (Admin Only) */}
      {isAdmin && contextMenu && (
        <>
          {/* Full-screen backdrop to safely capture outside clicks */}
          <div
            className="fixed inset-0 z-50 bg-transparent"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu(null);
            }}
          />

          <div
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-50 min-w-[150px] max-w-[min(calc(100vw-24px),180px)] overflow-hidden rounded-xl border border-border/80 bg-background/95 backdrop-blur-xl p-1 shadow-[0_12px_36px_rgba(0,0,0,0.2)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground truncate max-w-[160px]">
              {contextMenu.folderName}
            </div>
            <div className="my-1 h-px bg-border/60" />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const fId = contextMenu.folderId;
                const fName = contextMenu.folderName;
                setContextMenu(null);
                setEditingFolderId(fId);
                setEditName(fName);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-foreground hover:bg-subtle-background transition-colors cursor-pointer"
            >
              <Pencil size={13} className="text-muted-foreground" />
              <span>Rename</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const fId = contextMenu.folderId;
                setContextMenu(null);
                handleDeleteFolder(fId);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
