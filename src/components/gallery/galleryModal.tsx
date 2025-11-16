import {
    type RefObject,
    type PointerEvent as ReactPointerEvent,
    type WheelEvent as ReactWheelEvent,
    type ChangeEvent,
    type TouchEvent as ReactTouchEvent,
} from "react";
import Image from "next/image";
import type { GalleryItem } from "@/libs/types";

type ModalProps = {
    item: GalleryItem;
    zoom: number;
    minZoom: number;
    maxZoom: number;
    offset: { x: number; y: number };
    isDragging: boolean;
    isPinching: boolean;
    modalVisible: boolean;
    containerRef: RefObject<HTMLDivElement | null>;
    onClose: () => void;
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onWheel: (e: ReactWheelEvent<HTMLDivElement>) => void;
    onTouchStart: (e: ReactTouchEvent<HTMLDivElement>) => void;
    onTouchMove: (e: ReactTouchEvent<HTMLDivElement>) => void;
    onTouchEnd: (e: ReactTouchEvent<HTMLDivElement>) => void;
    onZoomSliderChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onZoomButton: (target: number) => void;
};

export default function GalleryModal({
    item,
    zoom,
    minZoom,
    maxZoom,
    offset,
    isDragging,
    isPinching,
    modalVisible,
    containerRef,
    onClose,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onZoomSliderChange,
    onZoomButton,
}: ModalProps) {
    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 transition-opacity duration-200 ${modalVisible ? "opacity-100" : "opacity-0"
                }`}
            onClick={onClose}
        >
            <div
                className={`relative w-full max-w-5xl max-h-[90vh] bg-slate-900/90 rounded-2xl overflow-hidden flex flex-col transform transition-all duration-200 ${modalVisible
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 translate-y-2"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header modal */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 md:px-4 md:py-3 border-b border-slate-700">
                    <div className="space-y-0.5 text-xs md:text-sm text-white">
                        <p className="text-[11px] uppercase tracking-wide text-rose-200">
                            {item.category}
                            {item.year ? ` · ${item.year}` : ""}
                        </p>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-[10px] text-slate-300">
                            Rasio: {item.ratio} · Resolusi: {item.resolution}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={item.src}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] md:text-xs font-semibold text-white hover:bg-emerald-700 transition"
                        >
                            Download
                        </a>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full bg-black/60 px-3 py-1.5 text-[11px] md:text-xs font-semibold text-white hover:bg-black/80 transition"
                        >
                            Tutup ✕
                        </button>
                    </div>
                </div>

                {/* Area gambar */}
                <div className="flex-1 flex items-center justify-center bg-black">
                    <div
                        ref={containerRef}
                        className="relative w-full max-w-4xl aspect-video overflow-hidden touch-none select-none"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                        onWheel={onWheel}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                        onTouchCancel={onTouchEnd}
                    >
                        <div
                            className="relative w-full h-full"
                            style={{
                                transform: `translate(${offset.x / zoom}px, ${offset.y / zoom
                                    }px) scale(${zoom})`,
                                transformOrigin: "center",
                                transition:
                                    isDragging || isPinching
                                        ? "none"
                                        : "transform 75ms ease-out",
                                cursor:
                                    zoom > 1
                                        ? isDragging || isPinching
                                            ? "grabbing"
                                            : "grab"
                                        : "default",
                            }}
                        >
                            <Image
                                src={item.src}
                                alt={item.title}
                                fill
                                className="object-contain"
                                onDragStart={(e) => e.preventDefault()}
                                sizes="100vw"
                            />
                        </div>
                    </div>
                </div>

                {/* Kontrol zoom */}
                <div className="px-3 py-3 md:px-4 md:py-3 border-t border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[11px] md:text-xs text-slate-200">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">Zoom</span>
                        <button
                            type="button"
                            onClick={() => onZoomButton(zoom - 0.25)}
                            className="rounded-full border border-slate-500 bg-slate-800 px-2 py-0.5 hover:bg-slate-700"
                        >
                            −
                        </button>
                        <input
                            type="range"
                            min={minZoom}
                            max={maxZoom}
                            step={0.1}
                            value={zoom}
                            onChange={onZoomSliderChange}
                            className="w-40 md:w-56 accent-rose-500"
                        />
                        <button
                            type="button"
                            onClick={() => onZoomButton(zoom + 0.25)}
                            className="rounded-full border border-slate-500 bg-slate-800 px-2 py-0.5 hover:bg-slate-700"
                        >
                            +
                        </button>
                        <span className="w-14 text-right tabular-nums">
                            {Math.round(zoom * 100)}%
                        </span>
                    </div>

                    <p className="text-[10px] text-slate-400">
                        Zoom bisa diatur dengan slider, scroll wheel, atau pinch (dua jari)
                        di mobile. Setelah di-zoom, drag dengan klik kiri atau geser dengan
                        jari untuk mengatur posisi. Halaman di belakang tidak ikut scroll
                        saat modal terbuka. Tekan ESC atau klik area gelap di luar gambar
                        untuk menutup.
                    </p>
                </div>
            </div>
        </div>
    );
}
