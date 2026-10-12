"use client";

import { FiCheck, FiLoader, FiUploadCloud } from "react-icons/fi";

type ImageUploadIndicatorProps = {
  active: boolean;
  label?: string;
  progress?: number;
  complete?: boolean;
  compact?: boolean;
};

export default function ImageUploadIndicator({
  active,
  label = "Mengunggah foto",
  progress,
  complete = false,
  compact = false,
}: ImageUploadIndicatorProps) {
  if (!active) return null;

  const normalizedProgress =
    typeof progress === "number"
      ? Math.min(100, Math.max(0, Math.round(progress)))
      : null;

  return (
    <div
      className="absolute inset-0 z-30 grid place-items-center bg-slate-950/68 p-2 text-white backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex min-w-0 flex-col items-center text-center">
        <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/14 shadow-lg ring-1 ring-white/20">
          {complete ? (
            <FiCheck className="h-5 w-5 text-emerald-300" />
          ) : (
            <>
              <FiUploadCloud className="h-5 w-5 text-cyan-200" />
              <FiLoader className="absolute h-9 w-9 animate-spin text-blue-300/80" />
            </>
          )}
        </span>

        {!compact && (
          <span className="mt-2 max-w-full truncate text-[11px] font-black">
            {complete ? "Foto siap" : label}
          </span>
        )}

        {normalizedProgress !== null && (
          <div className="mt-2 w-full min-w-16">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-linear-to-r from-blue-400 to-cyan-300 transition-[width] duration-200"
                style={{ width: `${normalizedProgress}%` }}
              />
            </div>
            {!compact && (
              <span className="mt-1 block text-[10px] font-bold text-blue-100">
                {normalizedProgress}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
