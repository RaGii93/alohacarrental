"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
  label?: string;
};

export function SignaturePad({ onConfirm, onCancel, label = "Draw your signature" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#0a0a12";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawing.current = true;
    setIsEmpty(false);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    isDrawing.current = false;
  }

  function clearPad() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  }

  function handleConfirm() {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    onConfirm(canvas.toDataURL("image/png"));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="relative overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          width={480}
          height={160}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {isEmpty && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Sign here
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={clearPad}
          className="text-xs text-slate-500 hover:text-slate-700 underline"
        >
          Clear
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" disabled={isEmpty} onClick={handleConfirm}>
            Confirm Signature
          </Button>
        </div>
      </div>
    </div>
  );
}
