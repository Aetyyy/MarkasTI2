"use client";

import {
  MouseEvent,
  TouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FiCheck,
  FiLoader,
  FiMinus,
  FiPlus,
  FiRefreshCcw,
  FiX,
} from "react-icons/fi";
import { createPortal } from "react-dom";
import { heicTo } from "heic-to/next";
import { isHeicImage } from "@/libs/api/imageUpload";

type ImageCropperModalProps = {
  file: File | null;
  title?: string;
  outputName?: string;
  onClose: () => void;
  onCrop: (file: File) => void | Promise<void>;
};

const outputSize = 900;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function ImageCropperModal({
  file,
  title = "Crop Foto",
  outputName = "cropped-image.webp",
  onClose,
  onCrop,
}: ImageCropperModalProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const [imageUrl, setImageUrl] = useState("");
  const [cropSize, setCropSize] = useState(320);
  const [loaded, setLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [naturalSize, setNaturalSize] = useState({
    width: 1,
    height: 1,
  });
  const [zoom, setZoom] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [offset, setOffset] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const updateCropSize = () => {
      setCropSize(Math.min(320, Math.max(180, window.innerWidth - 48)));
    };

    updateCropSize();
    window.addEventListener("resize", updateCropSize);
    return () => window.removeEventListener("resize", updateCropSize);
  }, []);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let objectUrl = "";
    setImageUrl("");
    setLoaded(false);
    setImageLoadError(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    void (async () => {
      const preview = await (await isHeicImage(file)
        ? heicTo({ blob: file, type: "image/jpeg", quality: 0.9 })
        : Promise.resolve(file));
      if (cancelled) return;
      objectUrl = URL.createObjectURL(preview);
      setImageUrl(objectUrl);
    })().catch(() => {
      if (!cancelled) setImageLoadError(true);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const baseScale = useMemo(() => {
    return Math.max(
      cropSize / naturalSize.width,
      cropSize / naturalSize.height,
    );
  }, [cropSize, naturalSize.height, naturalSize.width]);

  const displaySize = useMemo(() => {
    return {
      width: naturalSize.width * baseScale * zoom,
      height: naturalSize.height * baseScale * zoom,
    };
  }, [baseScale, naturalSize.height, naturalSize.width, zoom]);

  const fittedSize = useMemo(
    () => ({
      width: naturalSize.width * baseScale,
      height: naturalSize.height * baseScale,
    }),
    [baseScale, naturalSize.height, naturalSize.width],
  );

  function clampOffset(nextOffset: { x: number; y: number }) {
    const maxX = Math.max(0, (displaySize.width - cropSize) / 2);
    const maxY = Math.max(0, (displaySize.height - cropSize) / 2);

    return {
      x: clamp(nextOffset.x, -maxX, maxX),
      y: clamp(nextOffset.y, -maxY, maxY),
    };
  }

  useEffect(() => {
    setOffset((current) => clampOffset(current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displaySize.width, displaySize.height]);

  const handlePointerStart = (clientX: number, clientY: number) => {
    dragRef.current = {
      active: true,
      startX: clientX,
      startY: clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!dragRef.current.active) return;

    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;

    setOffset(
      clampOffset({
        x: dragRef.current.offsetX + dx,
        y: dragRef.current.offsetY + dy,
      }),
    );
  };

  const handlePointerEnd = () => {
    dragRef.current.active = false;
  };

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    handlePointerStart(event.clientX, event.clientY);
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    handlePointerMove(event.clientX, event.clientY);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];

    if (!touch) return;

    handlePointerStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];

    if (!touch) return;

    handlePointerMove(touch.clientX, touch.clientY);
  };

  const handleCrop = async () => {
    const img = imageRef.current;

    if (!img || !file || processing) return;

    setProcessing(true);

    const scale = baseScale * zoom;
    const sourceSize = Math.min(
      cropSize / scale,
      naturalSize.width,
      naturalSize.height,
    );
    const maxOffsetX = Math.max(0, (displaySize.width - cropSize) / 2);
    const maxOffsetY = Math.max(0, (displaySize.height - cropSize) / 2);
    const sourceOffsetX = clamp(offset.x, -maxOffsetX, maxOffsetX) / scale;
    const sourceOffsetY = clamp(offset.y, -maxOffsetY, maxOffsetY) / scale;
    const sx = clamp(
      (naturalSize.width - sourceSize) / 2 - sourceOffsetX,
      0,
      naturalSize.width - sourceSize,
    );
    const sy = clamp(
      (naturalSize.height - sourceSize) / 2 - sourceOffsetY,
      0,
      naturalSize.height - sourceSize,
    );

    const canvas = document.createElement("canvas");

    canvas.width = outputSize;
    canvas.height = outputSize;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setProcessing(false);
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, outputSize, outputSize);
    ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, outputSize, outputSize);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setProcessing(false);
          return;
        }

        const cropped = new File([blob], outputName, {
          type: "image/webp",
          lastModified: Date.now(),
        });

        try {
          await onCrop(cropped);
        } finally {
          setProcessing(false);
        }
      },
      "image/webp",
      0.96,
    );
  };

  if (!file) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-4xl border border-white/80 bg-white p-5 shadow-2xl shadow-blue-950/25">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              Crop Image
            </span>

            <h2 className="mt-3 text-2xl font-black text-slate-950">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-red-500 hover:text-white"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex justify-center">
          <div
            className="relative shrink-0 cursor-grab overflow-hidden rounded-4xl bg-linear-to-br from-blue-600 via-sky-600 to-cyan-400 active:cursor-grabbing"
            style={{ width: cropSize, height: cropSize, touchAction: "none" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handlePointerEnd}
            onMouseLeave={handlePointerEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handlePointerEnd}
          >
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                draggable={false}
                onLoad={(event) => {
                  setNaturalSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  });
                  setLoaded(true);
                }}
                onError={() => setImageLoadError(true)}
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: `${fittedSize.width}px`,
                  height: `${fittedSize.height}px`,
                  objectFit: "contain",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                  transformOrigin: "center",
                  pointerEvents: "none",
                }}
              />
            )}

            <div className="pointer-events-none absolute inset-0 rounded-4xl ring-4 ring-white/80" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.18)_1px,transparent_1px)] bg-size-[106px_106px]" />

            {!loaded && !imageLoadError && (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">
                Loading...
              </div>
            )}
            {imageLoadError && (
              <div className="absolute inset-0 flex items-center justify-center p-5 text-center text-sm font-bold text-white">
                Format gambar tidak dapat dibuka di perangkat ini.
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((current) => Math.max(1, current - 0.1))}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm"
            >
              <FiMinus className="h-5 w-5" />
            </button>

            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-blue-600"
            />

            <button
              type="button"
              onClick={() => setZoom((current) => Math.min(3, current + 0.1))}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm"
            >
              <FiPlus className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-blue-700 shadow-sm"
          >
            <FiRefreshCcw className="h-4 w-4" />
            Reset Crop
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-5 py-3 text-xs font-black text-blue-700 transition hover:bg-blue-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleCrop}
            disabled={processing || !loaded}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          >
            {processing ? (
              <FiLoader className="h-4 w-4 animate-spin" />
            ) : (
              <FiCheck className="h-4 w-4" />
            )}
            {processing ? "Menyiapkan foto..." : "Gunakan Foto"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
