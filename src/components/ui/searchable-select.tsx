"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  const [inputValue, setInputValue] = React.useState("");

  const sortedOptions = React.useMemo(
    () => [...options].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [options]
  );

  const displayValue = value && value !== "all" ? value : null;

  React.useEffect(() => {
    if (open) {
      setInputValue(value && value !== "all" ? value : "");
    }
  }, [open, value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const trimmed = inputValue.trim();
      const hasExactMatch = sortedOptions.some(
        (o) => o.localeCompare(trimmed, undefined, { sensitivity: "base" }) === 0
      );
      if (trimmed && !hasExactMatch) {
        onValueChange(trimmed);
        setOpen(false);
        e.preventDefault();
      }
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
            "h-9 w-40 justify-between border rounded-md bg-white border-gray-300 text-gray-900 font-normal",
            disabled && "opacity-50",
            className
          )}
        >
          {displayValue ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-white border-gray-200" align="start">
        <Command
          value={inputValue}
          onValueChange={setInputValue}
          filter={(filterValue, search) => {
            if (!search) return 1;
            const v = (filterValue ?? "").toLowerCase();
            const s = (search ?? "").toLowerCase();
            return v.includes(s) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search..." className="h-9" onKeyDown={handleKeyDown} />
          <CommandList>
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onValueChange("all");
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", (value === "all" || !value) ? "opacity-100" : "opacity-0")} />
                All
              </CommandItem>
              {sortedOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onValueChange(option);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
