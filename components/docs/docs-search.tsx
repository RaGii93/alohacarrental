"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import type { HelpSearchResult, HelpUiCopy } from "@/lib/help-docs";
import { searchHelpDocs } from "@/lib/help-docs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const terms = query
    .trim()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (!terms.length) return <>{text}</>;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "ig");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        terms.some((term) => part.toLowerCase() === term.toLowerCase()) ? (
          <mark key={`${part}-${index}`} className="rounded bg-[hsl(var(--primary)/0.16)] px-0.5 text-[hsl(var(--foreground))]">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </>
  );
}

export function DocsSearch({
  locale,
  copy,
  className,
}: {
  locale: string;
  copy: HelpUiCopy;
  className?: string;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo<HelpSearchResult[]>(() => {
    if (!query.trim()) return [];
    return searchHelpDocs(locale, query);
  }, [locale, query]);

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-[hsl(var(--foreground))]">
        {copy.searchLabel}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--foreground)/0.45)]" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className="h-12 rounded-2xl border-[hsl(var(--border))] bg-white pl-11 text-sm shadow-sm"
        />
      </div>

      {query.trim() ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))]">
            <Sparkles className="size-4 text-[hsl(var(--primary))]" />
            {copy.searchResultsTitle}
          </div>

          {results.length ? (
            <div className="space-y-3">
              {results.map((result) => (
                <a key={result.id} href={result.href}>
                  <Card className="rounded-2xl border-[hsl(var(--border))] bg-white p-4 transition-colors hover:border-[hsl(var(--primary)/0.34)] hover:bg-[hsl(var(--primary)/0.03)]">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        <HighlightedText text={result.title} query={query} />
                      </div>
                      <p className="text-sm leading-6 text-[hsl(var(--foreground)/0.72)]">
                        <HighlightedText text={result.snippet} query={query} />
                      </p>
                      <div className="text-xs font-medium text-[hsl(var(--primary))]">
                        {result.href}
                      </div>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-dashed border-[hsl(var(--border))] bg-white/85 p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{copy.searchEmptyTitle}</p>
                <p className="text-sm leading-6 text-[hsl(var(--foreground)/0.7)]">{copy.searchEmptyDescription}</p>
              </div>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
