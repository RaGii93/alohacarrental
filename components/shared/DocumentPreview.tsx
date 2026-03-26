"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { getBlobProxyUrl, getInlineBlobUrl, isPdfUrl } from "@/lib/blob";

type DocumentPreviewProps = {
  url?: string | null;
  title: string;
  openLabel: string;
  emptyLabel: string;
};

export function DocumentPreview({ url, title, openLabel, emptyLabel }: DocumentPreviewProps) {
  const inlineUrl = useMemo(() => getInlineBlobUrl(url), [url]);
  const previewUrl = useMemo(() => getBlobProxyUrl(inlineUrl), [inlineUrl]);
  const downloadUrl = useMemo(() => getBlobProxyUrl(url, { download: true }), [url]);

  if (!inlineUrl || !previewUrl || !downloadUrl) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const pdf = isPdfUrl(inlineUrl);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{title}</p>
      <div className="overflow-hidden rounded-[1.1rem] bg-muted/30">
        {pdf ? (
          <iframe
            src={previewUrl}
            title={title}
            className="h-[420px] w-full"
          />
        ) : (
          <img
            src={previewUrl}
            alt={title}
            className="max-h-[420px] w-full object-contain"
          />
        )}
      </div>
      <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
        <Button type="button" variant="outline" size="sm">
          {openLabel}
        </Button>
      </a>
    </div>
  );
}
