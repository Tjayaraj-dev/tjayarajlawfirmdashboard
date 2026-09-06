"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = { value: string; label: string }

function Combobox({
  value,
  onValueChange,
  items,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  disabled,
  id,
}: {
  value: string
  onValueChange: (value: string) => void
  items: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  id?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selected = items.find((item) => item.value === value)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.label.toLowerCase().includes(q))
  }, [items, query])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setQuery("")
  }

  const pick = (v: string) => {
    onValueChange(v)
    handleOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (filtered.length > 0) pick(filtered[0].value)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
          open && "border-ring ring-3 ring-ring/50"
        )}
      >
        <span
          className={cn(
            "line-clamp-1 flex-1 text-left",
            !selected && "text-muted-foreground"
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        initialFocus={inputRef}
        className="w-(--anchor-width) min-w-(--anchor-width) max-w-[min(24rem,var(--available-width))] gap-1.5 p-1.5"
      >
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder}
        />
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => pick(item.value)}
                className={cn(
                  "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1.5 pr-8 pl-2 text-left text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground",
                  item.value === value && "bg-accent/50"
                )}
              >
                {item.label}
                {item.value === value && (
                  <CheckIcon className="pointer-events-none absolute right-2 size-4" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
