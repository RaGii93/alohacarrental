"use client";

import { Button } from "@/components/ui/button";

export const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 50, 100] as const;

export function TablePaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);

  return (
    <div className="flex flex-col gap-3 py-3 text-sm md:flex-row md:items-center md:justify-between">
      <div className="text-muted-foreground">
        Showing {start}-{end} of {total}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="page-size" className="text-muted-foreground">Rows</label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-9 rounded-md border bg-background px-2"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Prev
        </Button>
        <span className="px-2 text-muted-foreground">
          {safePage}/{totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

