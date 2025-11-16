import React from "react";

export default function GalleryHeader() {
    return (
        <div
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            data-aos="fade-down"
        >
            <header className="max-w-2xl space-y-2">
                <p className="text-sm font-semibold text-rose-500 uppercase tracking-wide">
                    Markas TI · Gallery
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                    Dokumentasi Kegiatan Kelas
                </h1>
                <p className="text-sm md:text-base text-slate-600">
                    Kumpulan dokumentasi kegiatan akademik dan non-akademik kelas
                    Teknik Informatika, mulai dari praktikum di laboratorium hingga
                    kegiatan kebersamaan di luar kelas.
                </p>
            </header>

            {/* Button Upload (UI saja) */}
            <div className="flex md:justify-end">
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-md hover:bg-rose-700 hover:shadow-lg transition"
                >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-white/30 text-lg leading-none">
                        +
                    </span>
                    <span>Upload Foto</span>
                </button>
            </div>
        </div>
    );
}
