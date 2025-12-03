"use client";

import {
    useMemo,
    useState,
    useEffect,
    useRef,
    type PointerEvent,
    type WheelEvent,
    type ChangeEvent,
    type TouchEvent,
} from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import type { GalleryItem } from "@/libs/types";
import GalleryHeader from "@/components/gallery/galleryHeader";
import GalleryToolbar from "@/components/gallery/galleryToolbar";
import GalleryGrid from "@/components/gallery/galleryGrid";
import GalleryModal from "@/components/gallery/galleryModal";

const GALLERY_ITEMS: GalleryItem[] = [
    {
        id: 1,
        src: "https://placehold.co/1600x900",
        title: "Praktikum Pemrograman Web",
        category: "Praktikum",
        description: "Suasana praktikum pemrograman web di laboratorium.",
        year: "2024",
        ratio: "16:9",
        resolution: "1600x900",
    },
    {
        id: 2,
        src: "https://placehold.co/1920x1080",
        title: "Kegiatan Diskusi Kelas",
        category: "Kegiatan Kelas",
        description: "Diskusi kelompok mengenai studi kasus pemrograman.",
        year: "2024",
        ratio: "16:9",
        resolution: "1920x1080",
    },
    {
        id: 3,
        src: "https://placehold.co/1600x1200",
        title: "Seminar Teknik Informatika",
        category: "Seminar",
        description: "Sharing session bersama alumni Teknik Informatika.",
        year: "2023",
        ratio: "4:3",
        resolution: "1600x1200",
    },
    {
        id: 4,
        src: "https://placehold.co/1080x1080",
        title: "Outbond & Gathering Kelas",
        category: "Non-Akademik",
        description: "Kegiatan kebersamaan untuk mempererat kekompakan.",
        year: "2023",
        ratio: "1:1",
        resolution: "1080x1080",
    },
    {
        id: 5,
        src: "https://placehold.co/1080x1920",
        title: "Praktikum Jaringan Komputer",
        category: "Praktikum",
        description: "Setup jaringan dan simulasi konfigurasi router.",
        year: "2024",
        ratio: "9:16",
        resolution: "1080x1920",
    },
    {
        id: 6,
        src: "https://placehold.co/1280x720",
        title: "Presentasi Proyek Akhir",
        category: "Kegiatan Kelas",
        description: "Mahasiswa mempresentasikan hasil proyek akhir semester.",
        year: "2024",
        ratio: "16:9",
        resolution: "1280x720",
    },
];

const DRAG_SPEED = 1.6;
const MIN_ZOOM = 1; // 100%
const MAX_ZOOM = 4;

function clamp(val: number, min: number, max: number) {
    return Math.min(max, Math.max(min, val));
}

export default function GalleryClient() {
    const [activeCategory, setActiveCategory] = useState<string>("Semua");
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

    const [zoom, setZoom] = useState<number>(1);
    const [offset, setOffset] = useState<{ x: number; y: number }>({
        x: 0,
        y: 0,
    });

    const [isDragging, setIsDragging] = useState(false);
    const [isPinching, setIsPinching] = useState(false);
    const modalVisible = !!selectedItem;

    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const offsetStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement | null>(null);

    const pinchRef = useRef<{
        startDistance: number;
        startZoom: number;
    } | null>(null);

    // AOS
    useEffect(() => {
        AOS.init({
            once: true,
            duration: 600,
            easing: "ease-out-quart",
        });
    }, []);

    // Lock scroll saat modal terbuka
    useEffect(() => {
        if (typeof document === "undefined") return;

        const html = document.documentElement;
        const body = document.body;
        const prevHtmlOverflow = html.style.overflow;
        const prevBodyOverflow = body.style.overflow;

        if (selectedItem) {
            html.style.overflow = "hidden";
            body.style.overflow = "hidden";
        } else {
            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
        }

        return () => {
            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
        };
    }, [selectedItem]);

    // kategori otomatis
    const categories = useMemo(() => {
        const set = new Set(GALLERY_ITEMS.map((i) => i.category));
        return ["Semua", ...Array.from(set)];
    }, []);

    // filter berdasarkan kategori
    const filteredItems = useMemo(() => {
        if (activeCategory === "Semua") return GALLERY_ITEMS;
        return GALLERY_ITEMS.filter((item) => item.category === activeCategory);
    }, [activeCategory]);

    // Modal open/close handlers (declare before keydown listener)
    function handleOpenModal(item: GalleryItem) {
        setSelectedItem(item);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    }

    function handleCloseModal() {
        setSelectedItem(null);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setIsDragging(false);
        setIsPinching(false);
        dragStartRef.current = null;
        pinchRef.current = null;
    }

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") handleCloseModal();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);

    }, []);

    

    // Zoom dengan anchor di titik clientX/clientY
    function zoomAtPoint(newZoom: number, clientX: number, clientY: number) {
        if (!containerRef.current) {
            setZoom(clamp(newZoom, MIN_ZOOM, MAX_ZOOM));
            return;
        }

        const z0 = zoom;
        const z1 = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);

        const rect = containerRef.current.getBoundingClientRect();
        const cx = clientX - rect.left - rect.width / 2;
        const cy = clientY - rect.top - rect.height / 2;

        const s = z1 / z0;

        let nextX = offset.x * s + cx * (1 - s);
        let nextY = offset.y * s + cy * (1 - s);

        const maxX = (rect.width * (z1 - 1)) / 2;
        const maxY = (rect.height * (z1 - 1)) / 2;

        if (maxX > 0) nextX = clamp(nextX, -maxX, maxX);
        else nextX = 0;
        if (maxY > 0) nextY = clamp(nextY, -maxY, maxY);
        else nextY = 0;

        setZoom(z1);
        setOffset({ x: nextX, y: nextY });
    }

    function handleZoomButtons(target: number) {
        if (!containerRef.current) {
            setZoom(clamp(target, MIN_ZOOM, MAX_ZOOM));
            return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        zoomAtPoint(target, rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    const handleZoomSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (!containerRef.current) {
            setZoom(clamp(value, MIN_ZOOM, MAX_ZOOM));
            return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        zoomAtPoint(value, rect.left + rect.width / 2, rect.top + rect.height / 2);
    };

    /* --------- POINTER (MOUSE) HANDLERS --------- */
    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (!selectedItem) return;

        if (e.pointerType !== "mouse") return;
        if (e.button !== 0) return;

        if (zoom <= 1) return;

        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        offsetStartRef.current = { ...offset };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (!selectedItem) return;
        if (e.pointerType !== "mouse") return;

        if (!isDragging || !dragStartRef.current || !containerRef.current || zoom <= 1)
            return;

        const dx = (e.clientX - dragStartRef.current.x) * DRAG_SPEED;
        const dy = (e.clientY - dragStartRef.current.y) * DRAG_SPEED;

        let nextX = offsetStartRef.current.x + dx;
        let nextY = offsetStartRef.current.y + dy;

        const rect = containerRef.current.getBoundingClientRect();
        const maxX = (rect.width * (zoom - 1)) / 2;
        const maxY = (rect.height * (zoom - 1)) / 2;

        if (maxX > 0) nextX = clamp(nextX, -maxX, maxX);
        else nextX = 0;
        if (maxY > 0) nextY = clamp(nextY, -maxY, maxY);
        else nextY = 0;

        setOffset({ x: nextX, y: nextY });
    };

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== "mouse") return;
        if (isDragging) {
            setIsDragging(false);
            dragStartRef.current = null;
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                return null;
            }
        }
    };

    /* --------- TOUCH (MOBILE) HANDLERS --------- */

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        if (!selectedItem) return;
        if (!containerRef.current) return;

        if (e.touches.length === 1) {
            const t = e.touches[0];
            if (zoom > 1) {
                setIsDragging(true);
                dragStartRef.current = { x: t.clientX, y: t.clientY };
                offsetStartRef.current = { ...offset };
            }
            pinchRef.current = null;
            setIsPinching(false);
        } else if (e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            const dist = Math.hypot(dx, dy);
            pinchRef.current = { startDistance: dist, startZoom: zoom };
            setIsPinching(true);
            setIsDragging(false);
            dragStartRef.current = null;
        }

        e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (!selectedItem) return;
        if (!containerRef.current) return;

        if (e.touches.length === 2 && pinchRef.current) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            const dist = Math.hypot(dx, dy);
            const center = {
                x: (t1.clientX + t2.clientX) / 2,
                y: (t1.clientY + t2.clientY) / 2,
            };

            const scale = dist / pinchRef.current.startDistance;
            const targetZoom = pinchRef.current.startZoom * scale;
            zoomAtPoint(targetZoom, center.x, center.y);

            e.preventDefault();
            return;
        }

        if (
            e.touches.length === 1 &&
            isDragging &&
            dragStartRef.current &&
            zoom > 1
        ) {
            const t = e.touches[0];
            const dx = (t.clientX - dragStartRef.current.x) * DRAG_SPEED;
            const dy = (t.clientY - dragStartRef.current.y) * DRAG_SPEED;

            let nextX = offsetStartRef.current.x + dx;
            let nextY = offsetStartRef.current.y + dy;

            const rect = containerRef.current.getBoundingClientRect();
            const maxX = (rect.width * (zoom - 1)) / 2;
            const maxY = (rect.height * (zoom - 1)) / 2;

            if (maxX > 0) nextX = clamp(nextX, -maxX, maxX);
            else nextX = 0;
            if (maxY > 0) nextY = clamp(nextY, -maxY, maxY);
            else nextY = 0;

            setOffset({ x: nextX, y: nextY });

            e.preventDefault();
        }
    };

    const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 0) {
            setIsDragging(false);
            setIsPinching(false);
            dragStartRef.current = null;
            pinchRef.current = null;
        } else if (e.touches.length < 2 && isPinching) {
            setIsPinching(false);
            pinchRef.current = null;
        }
    };

    /* --------- WHEEL (PC ZOOM) --------- */

    const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
        if (!selectedItem) return;

        e.preventDefault();
        e.stopPropagation();

        const factor = Math.exp(-e.deltaY * 0.002);
        const targetZoom = zoom * factor;
        zoomAtPoint(targetZoom, e.clientX, e.clientY);
    };

    return (
        <>
            <section className="container mx-auto px-4 py-10 space-y-8">
                <GalleryHeader />

                <GalleryToolbar
                    categories={categories}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                />

                <GalleryGrid items={filteredItems} onSelect={handleOpenModal} />
            </section>

            {selectedItem && (
                <GalleryModal
                    item={selectedItem}
                    zoom={zoom}
                    minZoom={MIN_ZOOM}
                    maxZoom={MAX_ZOOM}
                    offset={offset}
                    isDragging={isDragging}
                    isPinching={isPinching}
                    modalVisible={modalVisible}
                    containerRef={containerRef}
                    onClose={handleCloseModal}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onWheel={handleWheel}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onZoomSliderChange={handleZoomSliderChange}
                    onZoomButton={handleZoomButtons}
                />
            )}
        </>
    );
}
