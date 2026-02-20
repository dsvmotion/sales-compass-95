"use client";
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const sortedOptions = React.useMemo(
    () => [...options].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [options]
  );

  const filtered = React.useMemo(() => {
    if (!search) return sortedOptions;
    const s = search.toLowerCase();
    return sortedOptions.filter((o) => o.toLowerCase().includes(s));
  }, [sortedOptions, search]);

  const displayValue = value && value !== "all" ? value : "";

  React.useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (val: string) => {
    onValueChange(val);
    setOpen(false);
    setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      e.preventDefault();
      handleSelect(search.trim());
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between border rounded-md bg-white border-gray-300 text-gray-900 font-normal text-sm",
            !displayValue && "text-gray-500",
            disabled && "opacity-50",
            className
          )}
        >
          <span className="truncate">{displayValue || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 bg-white border-gray-200"
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <div className="flex flex-col">
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search..."
            className="px-3 py-2 text-sm border-b border-gray-200 outline-none"
          />
          <div className="max-h-60 overflow-y-auto">
            {/* All option */}
            <button
              type="button"
              className={cn(
                "flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left",
                (!value || value === "all") && "font-medium"
              )}
              onClick={() => handleSelect("all")}
            >
              <Check className={cn("mr-2 h-4 w-4", (!value || value === "all") ? "opacity-100" : "opacity-0")} />
              All
            </button>
            {/* Custom value option when typing something not in list */}
            {search.trim() && filtered.length === 0 && (
              <button
                type="button"
                className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left text-blue-600"
                onClick={() => handleSelect(search.trim())}
              >
                Use &quot;{search.trim()}&quot;
              </button>
            )}
            {/* Options */}
            {filtered.map((option) => (
              <button
                type="button"
                key={option}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left",
                  value === option && "font-medium"
                )}
                onClick={() => handleSelect(option)}
              >
                <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                {option}
              </button>
            ))}
            {filtered.length === 0 && !search.trim() && (
              <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
