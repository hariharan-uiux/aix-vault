"use client";

import { cn } from "@/lib/utils";
import { Check, ChevronDown, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownOption {
  value: string;
  label: string;
  group?: string;
}

interface SearchableDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  align?: "left" | "right" | "center";
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  emptyText?: string;
  title?: string;
  showChevron?: boolean;
  onAdd?: (name: string) => void;
  addLabel?: string;
  onDelete?: (value: string) => void;
  onEdit?: (value: string, newName: string) => void;
}

export function SearchableDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  align = "center",
  className,
  triggerClassName,
  contentClassName,
  emptyText = "No results found",
  title,
  showChevron = false,
  onAdd,
  addLabel,
  onDelete,
  onEdit,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [confirmDeleteValue, setConfirmDeleteValue] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isManageMode, setIsManageMode] = useState(false);
  const [desktopCoords, setDesktopCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.group && opt.group.toLowerCase().includes(q)),
    );
  }, [options, query]);

  const exactMatchExists = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return options.some((opt) => opt.label.toLowerCase() === q);
  }, [options, query]);

  // Compute fixed position for desktop portaled dropdown to avoid overflow clipping
  const updateDesktopPosition = useCallback(() => {
    if (!containerRef.current) return;
    const triggerRect = containerRef.current.getBoundingClientRect();
    const dropdownEl = dropdownRef.current;
    const dropdownWidth = dropdownEl?.offsetWidth || 240;
    const dropdownHeight = dropdownEl?.offsetHeight || 280;

    // Check if trigger is scrolled completely out of viewport
    const isTriggerVisible =
      triggerRect.bottom > 0 &&
      triggerRect.top < window.innerHeight &&
      triggerRect.width > 0 &&
      triggerRect.height > 0;

    if (!isTriggerVisible) {
      setOpen(false);
      return;
    }

    // Vertical positioning: prefer below, flip above if not enough space below
    let top = triggerRect.bottom + 6;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (spaceBelow < dropdownHeight + 16 && spaceAbove > spaceBelow) {
      top = Math.max(12, triggerRect.top - dropdownHeight - 6);
    }

    // Horizontal positioning based on align prop:
    let left = triggerRect.left;
    if (align === "right") {
      left = triggerRect.right - dropdownWidth;
    } else if (align === "center") {
      left = triggerRect.left + (triggerRect.width - dropdownWidth) / 2;
    }

    // Viewport bounds clamping: ensure dropdown never overflows viewport (keep 12px margin)
    const maxLeft = Math.max(12, window.innerWidth - dropdownWidth - 12);
    const minLeft = 12;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    setDesktopCoords({
      top: Math.round(top),
      left: Math.round(left),
    });
  }, [align]);

  // Click outside to close (desktop only; mobile modal uses backdrop click)
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (isMobile) return;
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isMobile]);

  // Desktop fixed positioning tracking (capture scroll on all scrollable ancestors)
  useEffect(() => {
    if (!open || isMobile) return;
    updateDesktopPosition();

    const handleScrollOrResize = () => {
      updateDesktopPosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, isMobile, updateDesktopPosition]);

  // Lock body scroll when mobile popup is open in the middle of the screen
  useEffect(() => {
    if (open && isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open, isMobile]);

  // Focus search input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlightedIndex(0);
      setIsAdding(false);
      setNewOptionName("");
      setConfirmDeleteValue(null);
      setEditingValue(null);
      setEditingName("");
      setIsManageMode(false);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else {
      setEditingValue(null);
      setEditingName("");
      setIsManageMode(false);
    }
  }, [open]);

  // Focus inline edit input when starting to edit
  useEffect(() => {
    if (editingValue && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingValue]);

  // Keep highlighted item visible
  useEffect(() => {
    if (!open || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLButtonElement>("[data-dropdown-item]");
    const activeItem = items[highlightedIndex];
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, open]);

  const handleAddNew = (nameToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed || !onAdd) return;
    onAdd(trimmed);
    setIsAdding(false);
    setNewOptionName("");
    setQuery("");
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].value);
          setOpen(false);
        } else if (!exactMatchExists && query.trim() && onAdd) {
          handleAddNew(query.trim());
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative text-left", className || "inline-block")}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!open && !isMobile) {
            updateDesktopPosition();
          }
          setOpen((prev) => !prev);
        }}
        title={title}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] sm:text-[13px] font-medium transition-all select-none outline-none focus:outline-none focus-visible:outline-none",
          "border border-border/80 bg-subtle-background/80 text-foreground hover:bg-subtle-background hover:border-foreground/30",
          open && "border-foreground/30 text-foreground bg-subtle-background",
          disabled && "opacity-60 cursor-not-allowed hover:bg-subtle-background/80 hover:border-border/80",
          !disabled && "cursor-pointer",
          triggerClassName,
        )}
      >
        <span
          className={cn(
            "truncate flex-1 text-left min-w-0",
            !selectedOption && "text-muted-foreground",
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {showChevron && (
          <ChevronDown
            size={12}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180 text-foreground",
            )}
          />
        )}
      </button>

      {/* Dropdown / Modal Content */}
      {(() => {
        const renderDropdownBody = (isMobilePopup: boolean) => (
          <>
            {/* Integrated Search Bar with Touch-Friendly Manage Mode Toggle */}
            <div
              className={cn(
                "relative flex items-center border-b border-border/50 mb-1 shrink-0",
                isMobilePopup ? "px-3 py-2" : "px-2.5 py-1.5",
              )}
            >
              <Search size={isMobilePopup ? 14 : 13} className="shrink-0 text-muted-foreground mr-2" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={searchPlaceholder}
                style={{ outline: "none", boxShadow: "none", border: "none" }}
                className={cn(
                  "w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 border-none shadow-none p-0 m-0",
                  isMobilePopup ? "text-[13px] h-7" : "text-[12px]",
                )}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="shrink-0 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
              {(onEdit || onDelete) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsManageMode((prev) => !prev);
                    setEditingValue(null);
                    setConfirmDeleteValue(null);
                  }}
                  className={cn(
                    "shrink-0 ml-1.5 px-2 py-0.5 rounded-full font-medium transition-all cursor-pointer select-none",
                    isMobilePopup ? "text-[11px] py-1 px-2.5" : "text-[10.5px]",
                    isManageMode
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground bg-subtle-background hover:bg-subtle-background/80 active:scale-95",
                  )}
                  title={isManageMode ? "Exit manage mode" : "Manage items (Edit/Delete)"}
                >
                  {isManageMode ? "Done" : "Manage"}
                </button>
              )}
            </div>

            {/* Manage mode banner for touch devices */}
            {isManageMode && (
              <div className="px-2.5 py-1 mb-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-[10.5px] text-orange-600 dark:text-orange-400 font-medium flex items-center justify-between animate-in fade-in-0 duration-100 shrink-0">
                <span>Tap item to rename, or tap trash to delete</span>
              </div>
            )}

            {/* Quick add option when search query doesn't match */}
            {onAdd && !exactMatchExists && query.trim() && (
              <button
                type="button"
                onClick={() => handleAddNew(query.trim())}
                className="flex items-center gap-1.5 w-full px-2.5 py-1.5 mb-1 text-[12px] font-medium text-foreground bg-subtle-background hover:bg-subtle-background/80 rounded-lg text-left transition-colors cursor-pointer border border-dashed border-border/80 shrink-0"
              >
                <Plus size={12} className="shrink-0 text-muted-foreground" />
                <span className="truncate">Add &ldquo;{query.trim()}&rdquo;</span>
              </button>
            )}

            {/* Options list */}
            <div
              ref={listRef}
              role="listbox"
              className={cn(
                "overflow-y-auto",
                isMobilePopup
                  ? "max-h-[50vh] flex-1 space-y-1 py-1 pr-0.5 overscroll-contain"
                  : "max-h-52 space-y-0.5 py-0.5",
              )}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => {
                  const isSelected = option.value === value;
                  const isHighlighted = idx === highlightedIndex;
                  const isDeleting = confirmDeleteValue === option.value;
                  const isEditing = editingValue === option.value;

                  if (isEditing) {
                    return (
                      <div
                        key={option.value}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 w-full px-2.5 py-1.5 my-0.5 rounded-xl bg-subtle-background border border-orange-500/40 dark:border-orange-400/40 shadow-xs"
                      >
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              const trimmed = editingName.trim();
                              if (trimmed && onEdit) {
                                onEdit(option.value, trimmed);
                              }
                              setEditingValue(null);
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingValue(null);
                            }
                          }}
                          className="flex-1 min-w-0 bg-transparent text-[12.5px] text-foreground outline-none focus:outline-none border-none p-0 focus:ring-0"
                          placeholder="Rename..."
                        />
                        <button
                          type="button"
                          title="Save rename (Enter)"
                          onClick={(e) => {
                            e.stopPropagation();
                            const trimmed = editingName.trim();
                            if (trimmed && onEdit) {
                              onEdit(option.value, trimmed);
                            }
                            setEditingValue(null);
                          }}
                          className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 cursor-pointer transition-colors"
                        >
                          <Check size={13} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          title="Cancel (Esc)"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingValue(null);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-subtle-background cursor-pointer transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        if (isManageMode) {
                          if (onEdit) {
                            setEditingValue(option.value);
                            setEditingName(option.label);
                          }
                          return;
                        }
                        onChange(option.value);
                        setOpen(false);
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        "group flex items-center justify-between w-full text-left transition-colors cursor-pointer select-none",
                        isMobilePopup ? "px-3 py-2.5 text-[13px] rounded-xl" : "px-2.5 py-1.5 text-[12px] rounded-lg",
                        isSelected
                          ? "text-orange-600 dark:text-orange-400 font-medium bg-orange-500/10 dark:bg-orange-400/15"
                          : "text-muted-foreground hover:text-foreground",
                        isHighlighted && !isSelected && "bg-subtle-background/50",
                        isManageMode && "hover:bg-orange-500/5",
                      )}
                    >
                      <div className="flex flex-col min-w-0 flex-1 pr-2">
                        <span className="truncate">{option.label}</span>
                        {option.group && (
                          <span className="text-[10px] text-muted-foreground/70 truncate">
                            {option.group}
                          </span>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isSelected && (
                          <Check size={14} className="text-orange-600 dark:text-orange-400 stroke-[2.5] mr-1" />
                        )}
                        {onEdit && !isDeleting && (
                          <button
                            type="button"
                            title={`Edit ${option.label}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingValue(option.value);
                              setEditingName(option.label);
                              setConfirmDeleteValue(null);
                            }}
                            className={cn(
                              "p-1.5 sm:p-1 size-7 sm:size-6 flex items-center justify-center rounded-md transition-all cursor-pointer active:scale-95",
                              isManageMode
                                ? "opacity-100 bg-orange-500/15 text-orange-600 dark:text-orange-400 hover:bg-orange-500/25"
                                : "opacity-75 sm:opacity-0 sm:group-hover:opacity-100 hover:opacity-100 active:opacity-100 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 active:bg-orange-500/15",
                            )}
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                        {onDelete && (
                          isDeleting ? (
                            <button
                              type="button"
                              title="Click to confirm deletion"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(option.value);
                                setConfirmDeleteValue(null);
                              }}
                              className="flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors cursor-pointer active:scale-95"
                            >
                              Delete?
                            </button>
                          ) : (
                            <button
                              type="button"
                              title={`Delete ${option.label}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteValue(option.value);
                              }}
                              className={cn(
                                "p-1.5 sm:p-1 size-7 sm:size-6 flex items-center justify-center rounded-md transition-all cursor-pointer active:scale-95",
                                isManageMode
                                  ? "opacity-100 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                                  : "opacity-75 sm:opacity-0 sm:group-hover:opacity-100 hover:opacity-100 active:opacity-100 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 active:bg-red-500/15",
                              )}
                            >
                              <Trash2 size={12} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-[12px] text-muted-foreground">
                  {emptyText}
                </div>
              )}
            </div>

            {/* Bottom Add Option Section */}
            {onAdd && (
              <div className="border-t border-border/50 pt-1 mt-1 shrink-0">
                {isAdding ? (
                  <div
                    className="flex items-center gap-1.5 p-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      ref={newInputRef}
                      type="text"
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNew(newOptionName);
                        } else if (e.key === "Escape") {
                          e.stopPropagation();
                          setIsAdding(false);
                          setNewOptionName("");
                        }
                      }}
                      placeholder={`New ${addLabel || "option"} name...`}
                      className="h-7 w-full bg-subtle-background/80 rounded-md px-2 text-[12px] text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-foreground/40"
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={!newOptionName.trim()}
                      onClick={() => handleAddNew(newOptionName)}
                      className="h-7 px-2.5 rounded-md bg-foreground text-background text-[11px] font-medium hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setNewOptionName("");
                      }}
                      className="h-7 px-2 rounded-md hover:bg-subtle-background text-muted-foreground hover:text-foreground text-[11px] transition-colors cursor-pointer shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAdding(true);
                      requestAnimationFrame(() => newInputRef.current?.focus());
                    }}
                    className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-subtle-background/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus size={13} className="shrink-0 text-muted-foreground" />
                    <span>Add {addLabel || "option"}</span>
                  </button>
                )}
              </div>
            )}
          </>
        );

        return (
          <>
            {/* Mobile Modal Popup: Opens in the middle of the screen in mobile view alone */}
            {open && isMobile && mounted &&
              createPortal(
                <div
                  className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
                  onClick={() => setOpen(false)}
                  role="presentation"
                >
                  <div
                    className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-white/[0.14] bg-background dark:bg-[#16171d] p-3.5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[82vh] flex flex-col overflow-hidden text-left"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label={title || placeholder || "Select option"}
                  >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-black/10 dark:border-white/[0.1] mb-2 shrink-0">
                      <span className="text-[14px] font-semibold text-foreground">
                        {title || placeholder || "Select option"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="flex size-7.5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                        aria-label="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {renderDropdownBody(true)}
                  </div>
                </div>,
                document.body,
              )}

            {/* Desktop Dropdown: Portaled to document.body with fixed positioning so it is never clipped by overflow */}
            {open && !isMobile && mounted && desktopCoords &&
              createPortal(
                <div
                  ref={dropdownRef}
                  style={{
                    position: "fixed",
                    top: `${desktopCoords.top}px`,
                    left: `${desktopCoords.left}px`,
                  }}
                  className={cn(
                    "z-[80] w-60 rounded-xl border border-border bg-background p-1.5 shadow-2xl shadow-black/20 dark:shadow-black/60 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 text-left",
                    contentClassName,
                  )}
                >
                  {renderDropdownBody(false)}
                </div>,
                document.body,
              )}
          </>
        );
      })()}
    </div>
  );
}
