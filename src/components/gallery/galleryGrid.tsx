import React from "react";
import Image from "next/image";
import type { GalleryItem } from "@/libs/types";

type GridProps = {
    items: GalleryItem[];
    onSelect: (item: GalleryItem) => void;
};

export default function GalleryGrid({ items, onSelect }: GridProps) {
    return (
        <div
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            data-aos="fade-up"
            data-aos-delay="150"
        >
            {items.map((item, idx) => (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item)}
                    className="group relative overflow-hidden rounded-2xl bg-slate-200 shadow-sm hover:shadow-lg transition text-left"
                    data-aos="zoom-in-up"
                    data-aos-delay={180 + idx * 60}
                >
                    <div className="relative w-full aspect-video">
                        <Image
                            src={item.src}
                            alt={item.title}
                            fill
                            onDragStart={(e) => e.preventDefault()}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        />
                    </div>

                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <figcaption className="pointer-events-none absolute bottom-3 left-3 right-3 space-y-1 text-white opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-200">
                            {item.category}
                            {item.year ? ` · ${item.year}` : ""}
                        </p>
                        <h2 className="text-sm md:text-base font-semibold leading-snug">
                            {item.title}
                        </h2>
                        {item.description && (
                            <p className="text-[11px] md:text-xs text-slate-100">
                                {item.description}
                            </p>
                        )}
                    </figcaption>
                </button>
            ))}
        </div>
    );
}
