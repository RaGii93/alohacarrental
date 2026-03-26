"use client";

import { useState } from "react";
import { Bot, Loader2, MessageSquareText, SendHorizontal, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { HelpAssistantReply } from "@/lib/help-assistant";
import type { HelpUiCopy } from "@/lib/help-docs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; reply: HelpAssistantReply };

export function HelpAssistant({
  locale,
  copy,
  suggestions,
  compact = false,
  className,
}: {
  locale: string;
  copy: HelpUiCopy;
  suggestions: string[];
  compact?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const askQuestion = async (nextQuestion?: string) => {
    const currentQuestion = (nextQuestion ?? query).trim();
    if (!currentQuestion || loading) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: currentQuestion,
    };

    setLoading(true);
    setError(null);
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");

    try {
      const response = await fetch("/api/help-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, query: currentQuestion }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.reply) {
        throw new Error(payload?.error || copy.assistantError);
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        reply: payload.reply as HelpAssistantReply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (cause: any) {
      setError(cause?.message || copy.assistantError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`rounded-[1.8rem] border-[hsl(var(--border))] bg-white p-6 shadow-[0_24px_56px_-34px_hsl(215_28%_17%/0.16)] ${className || ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
            <Bot className="size-6" />
          </div>
          <h2 className="mt-4 text-xl font-black tracking-[-0.03em] text-[hsl(var(--foreground))]">
            {copy.assistantTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[hsl(var(--foreground)/0.7)]">
            {copy.assistantDescription}
          </p>
        </div>

        {compact ? (
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/help/assistant" locale={locale}>
              {copy.assistantCta}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void askQuestion();
            }
          }}
          placeholder={copy.assistantInputPlaceholder}
          className="h-12 rounded-2xl"
        />
        <Button
          onClick={() => void askQuestion()}
          disabled={loading || !query.trim()}
          className="h-12 rounded-2xl px-5"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
          {loading ? copy.assistantSubmitting : copy.assistantSubmit}
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => void askQuestion(suggestion)}
            className="rounded-full border border-[hsl(var(--primary)/0.18)] bg-[hsl(var(--primary)/0.05)] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--primary)/0.11)]"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {messages.length ? (
          messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[88%] rounded-2xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-medium text-[hsl(var(--primary-foreground))]">
                  <div className="mb-1 flex items-center justify-end gap-2 text-[11px] uppercase tracking-[0.22em] opacity-75">
                    <span>User</span>
                    <UserRound className="size-3.5" />
                  </div>
                  {message.text}
                </div>
              </div>
            ) : (
              <div key={message.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.35)] p-4">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--primary))]">
                  <Bot className="size-3.5" />
                  Assistant
                </div>
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{message.reply.intro}</p>
                {message.reply.bullets.length ? (
                  <ul className="mt-3 space-y-2 pl-5 text-sm leading-6 text-[hsl(var(--foreground)/0.78)]">
                    {message.reply.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
                {message.reply.sources.length ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--foreground)/0.55)]">
                      {copy.assistantSourcesTitle}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.reply.sources.map((source) => (
                        <a
                          key={`${message.id}-${source.href}`}
                          href={source.href}
                          className="rounded-full border border-[hsl(var(--border))] bg-white px-3 py-1.5 text-xs font-semibold text-[hsl(var(--foreground)/0.8)] hover:border-[hsl(var(--primary)/0.28)] hover:text-[hsl(var(--foreground))]"
                        >
                          {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] bg-white/70 p-6 text-sm text-[hsl(var(--foreground)/0.7)]">
            <div className="flex items-center gap-2 font-semibold text-[hsl(var(--foreground))]">
              <MessageSquareText className="size-4 text-[hsl(var(--primary))]" />
              {copy.assistantEmpty}
            </div>
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
