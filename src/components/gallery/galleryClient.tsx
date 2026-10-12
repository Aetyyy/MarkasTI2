"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  FiBookmark,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiPlus,
  FiSearch,
  FiUploadCloud,
} from "react-icons/fi";
import type {
  GalleryMentionUser,
  GalleryPostForClient,
  GalleryRealtimeEvent,
} from "@/types/gallery";
import GalleryInstagramModal from "@/components/gallery/galleryInstagramModal";
import GalleryUploadModal from "@/components/gallery/galleryUploadModal";
import { getDisplayImageUrl } from "@/libs/api/imageUrl";

type GalleryClientProps = {
  initialPosts: GalleryPostForClient[];
  mentionUsers: GalleryMentionUser[];
};

type PageSizeValue = 10 | 20 | 30 | 50 | "CUSTOM";

function applyRealtimeToPost(
  post: GalleryPostForClient,
  payload: GalleryRealtimeEvent,
): GalleryPostForClient {
  if (!("postId" in payload)) return post;
  if (post.id !== payload.postId) return post;

  if (payload.type === "POST_LIKED") {
    return {
      ...post,
      likesCount: payload.likesCount,
    };
  }

  if (payload.type === "POST_SHARED") {
    return {
      ...post,
      sharesCount: payload.sharesCount,
    };
  }

  if (payload.type === "COMMENT_CREATED") {
    const exists = post.commentsPreview.some(
      (comment) => comment.id === payload.comment.id,
    );

    return {
      ...post,
      commentsCount: payload.commentsCount,
      commentsPreview: exists
        ? post.commentsPreview
        : [payload.comment, ...post.commentsPreview],
    };
  }

  if (payload.type === "COMMENT_REPLIED") {
    return {
      ...post,
      commentsCount: payload.commentsCount,
    };
  }

  if (payload.type === "POST_PINNED") {
    return {
      ...post,
      isPinned: payload.isPinned,
    };
  }

  if (payload.type === "POST_UPDATED") {
    return {
      ...post,
      title: payload.title,
      description: payload.description,
      category: payload.category,
    };
  }

  return post;
}

export default function GalleryClient({
  initialPosts,
  mentionUsers,
}: GalleryClientProps) {
  const { status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === "authenticated";

  const [posts, setPosts] = useState(initialPosts);
  const [selectedPost, setSelectedPost] = useState<GalleryPostForClient | null>(
    null,
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const uploadOpenRef = useRef(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSizeMode, setPageSizeMode] = useState<PageSizeValue>(10);
  const [customPageSize, setCustomPageSize] = useState(10);

  const reloadGallery = useCallback(async () => {
    try {
      const response = await fetch("/api/gallery", { cache: "no-store" });
      const result = (await response.json()) as {
        success: boolean;
        data?: GalleryPostForClient[];
      };

      if (response.ok && result.success && Array.isArray(result.data)) {
        setPosts(result.data);
      }
    } catch {
      // Data yang sedang tampil dipertahankan jika refresh realtime gagal.
    }
  }, []);


  useEffect(() => {
    const eventSource = new EventSource("/api/realtime/gallery");

    eventSource.addEventListener("gallery-event", (event) => {
      const payload = JSON.parse(
        (event as MessageEvent).data,
      ) as GalleryRealtimeEvent;

      if (payload.type === "GALLERY_REFRESH") {
        if (uploadOpenRef.current) return;
        void reloadGallery();
        return;
      }

      if (payload.type === "POST_DELETED") {
        setPosts((prev) => prev.filter((post) => post.id !== payload.postId));

        setSelectedPost((prev) => {
          if (!prev) return prev;
          if (prev.id === payload.postId) return null;
          return prev;
        });

        return;
      }

      setPosts((prev) =>
        prev.map((post) => applyRealtimeToPost(post, payload)),
      );

      setSelectedPost((prev) => {
        if (!prev) return prev;
        return applyRealtimeToPost(prev, payload);
      });
    });

    return () => {
      eventSource.close();
    };
  }, [reloadGallery]);

  const pageSize = pageSizeMode === "CUSTOM" ? customPageSize : pageSizeMode;

  const categories = useMemo(() => {
    const set = new Set(posts.map((post) => post.category));
    return ["Semua", ...Array.from(set)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return posts.filter((post) => {
      const matchCategory = category === "Semua" || post.category === category;
      const matchFavorite = showFavoritesOnly ? post.likedByMe : true;

      const matchSearch = keyword
        ? [post.title, post.description || "", post.category, post.uploadedBy]
            .join(" ")
            .toLowerCase()
            .includes(keyword)
        : true;

      return matchCategory && matchFavorite && matchSearch;
    });
  }, [posts, category, search, showFavoritesOnly]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [filteredPosts]);

  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedPosts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedPosts.slice(start, start + pageSize);
  }, [sortedPosts, safePage, pageSize]);

  function refreshGallery() {
    void reloadGallery();
  }

  function openUpload() {
    uploadOpenRef.current = true;
    setUploadOpen(true);
  }

  function closeUpload() {
    uploadOpenRef.current = false;
    setUploadOpen(false);
  }

  function openPost(post: GalleryPostForClient, imageIndex = 0) {
    setSelectedPost(post);
    setActiveImageIndex(imageIndex);
  }

  function closePost() {
    setSelectedPost(null);
    setActiveImageIndex(0);
  }

  function updateSelectedPost(nextPost: GalleryPostForClient) {
    setSelectedPost(nextPost);
    setPosts((prev) =>
      prev.map((post) => (post.id === nextPost.id ? nextPost : post)),
    );
  }

  function getPageNumbers() {
    const pages: number[] = [];
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, safePage + 2);

    for (let current = start; current <= end; current++) {
      pages.push(current);
    }

    return pages;
  }

  return (
    <>
      <section className="gallery-page-shell relative container mx-auto space-y-8 px-4 py-8 md:py-12">

        <div
          className="relative z-10 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-xl shadow-blue-900/10 backdrop-blur-xl md:p-8"
          data-aos="fade-up"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                <FiGrid className="h-4 w-4" />
                Gallery TI2
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                Dokumentasi Kelas
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Upload dokumentasi kelas, like, komentar, balas komentar, share,
                dan update realtime.
              </p>
            </div>

            {isLoggedIn && (
              <button
                type="button"
                onClick={openUpload}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                <FiUploadCloud className="h-5 w-5" />
                Upload Foto
              </button>
            )}
          </div>
        </div>

        <div
          className="relative z-10 grid gap-3 rounded-3xl border border-white/70 bg-white/80 p-3 shadow-lg shadow-blue-900/5 backdrop-blur-xl lg:grid-cols-[1fr_auto_auto_auto]"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari judul, uploader, kategori..."
              className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 pl-11 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setShowFavoritesOnly((prev) => !prev);
              setPage(1);
            }}
            className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
              showFavoritesOnly
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-blue-100 bg-white text-blue-700 hover:bg-blue-50"
            }`}
          >
            Favorit
          </button>

          <div className="flex gap-2">
            <select
              value={pageSizeMode}
              onChange={(e) => {
                const value = e.target.value;
                setPage(1);
                setPageSizeMode(
                  value === "CUSTOM"
                    ? "CUSTOM"
                    : (Number(value) as PageSizeValue),
                );
              }}
              className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={30}>30 / page</option>
              <option value={50}>50 / page</option>
              <option value="CUSTOM">Custom</option>
            </select>

            {pageSizeMode === "CUSTOM" && (
              <input
                type="number"
                min={1}
                max={100}
                value={customPageSize}
                onChange={(e) => {
                  setPage(1);
                  setCustomPageSize(
                    Math.min(100, Math.max(1, Number(e.target.value) || 10)),
                  );
                }}
                className="w-24 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            )}
          </div>
        </div>

        <div className="relative z-10">
          {paginatedPosts.length > 0 ? (
            <div className="gallery-post-grid">
              {paginatedPosts.map((post, index) => {
                const cover = post.images[0];

                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => openPost(post)}
                    data-aos="zoom-in-up"
                    data-aos-delay={index * 35}
                    className="group relative aspect-square overflow-hidden rounded-3xl bg-slate-200 shadow-lg shadow-blue-900/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/15"
                  >
                    {cover ? (
                      <Image
                        src={getDisplayImageUrl(cover.thumbnailUrl || cover.url)}
                        alt={post.title}
                        fill
                        unoptimized
                        loading={index < 5 ? "eager" : "lazy"}
                        sizes="(max-width: 768px) 50vw, 20vw"
                        className="object-cover transition duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-blue-50 text-blue-600">
                        <FiPlus className="h-8 w-8" />
                      </div>
                    )}

                    {post.isPinned && (
                      <div className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-amber-400 text-white shadow-lg shadow-amber-500/30">
                        <FiBookmark className="h-4 w-4 fill-current" />
                      </div>
                    )}

                    {post.images.length > 1 && (
                      <div className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-black text-white backdrop-blur-md">
                        {post.images.length} Foto
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-left text-white">
                      <p className="line-clamp-1 text-sm font-black">
                        {post.title}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-white/80">
                        ❤ {post.likesCount} · 💬 {post.commentsCount} · ↗{" "}
                        {post.sharesCount}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-blue-200 bg-white/70 p-10 text-center shadow-sm">
              <p className="text-lg font-black text-slate-900">
                Belum ada foto
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Upload dokumentasi pertama untuk gallery kelas.
              </p>
            </div>
          )}
        </div>

        {sortedPosts.length > 0 && (
          <div className="relative z-10 flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-lg shadow-blue-900/5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Menampilkan{" "}
              <span className="font-black text-slate-900">
                {(safePage - 1) * pageSize + 1}
              </span>{" "}
              -{" "}
              <span className="font-black text-slate-900">
                {Math.min(safePage * pageSize, sortedPosts.length)}
              </span>{" "}
              dari{" "}
              <span className="font-black text-slate-900">
                {sortedPosts.length}
              </span>{" "}
              post
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
                className="grid h-10 w-10 place-items-center rounded-xl border border-blue-100 bg-white text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronLeft />
              </button>

              {getPageNumbers().map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className={`grid h-10 w-10 place-items-center rounded-xl border text-sm font-black transition ${
                    item === safePage
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "border-blue-100 bg-white text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  {item}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={safePage === totalPages}
                className="grid h-10 w-10 place-items-center rounded-xl border border-blue-100 bg-white text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedPost && (
        <GalleryInstagramModal
          post={selectedPost}
          mentionUsers={mentionUsers}
          activeImageIndex={activeImageIndex}
          onActiveImageChange={setActiveImageIndex}
          onClose={closePost}
          onPostChange={updateSelectedPost}
        />
      )}

      {isLoggedIn && uploadOpen && (
        <GalleryUploadModal
          mentionUsers={mentionUsers}
          onClose={closeUpload}
          onUploaded={() => {
            closeUpload();
            refreshGallery();
          }}
        />
      )}
    </>
  );
}
