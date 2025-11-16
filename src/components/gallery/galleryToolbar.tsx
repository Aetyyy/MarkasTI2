import React from "react";

type ToolbarProps = {
    categories: string[];
    activeCategory: string;
    onCategoryChange: (v: string) => void;
};

export default function GalleryToolbar({
    categories,
    activeCategory,
    onCategoryChange,
}: ToolbarProps) {
    return (
        <div
            className="flex flex-wrap gap-2 text-xs md:text-sm text-slate-600"
            data-aos="fade-up"
            data-aos-delay="100"
        >
            {categories.map((cat) => (
                <button
                    key={cat}
                    type="button"
                    onClick={() => onCategoryChange(cat)}
                    className={`px-3 py-1 rounded-full border transition ${activeCategory === cat
                            ? "bg-rose-600 border-rose-600 text-white"
                            : "bg-white border-slate-200 hover:border-rose-300"
                        }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
