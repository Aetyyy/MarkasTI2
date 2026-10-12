"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type TouchEvent,
} from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { confirmDanger } from "@/libs/swal";
import { getDisplayImageUrl } from "@/libs/api/imageUrl";
import {
  FiBookmark,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiDownload,
  FiEdit3,
  FiHeart,
  FiLoader,
  FiMessageCircle,
  FiMoreHorizontal,
  FiSend,
  FiShare2,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import {
  createGalleryCommentAction,
  deleteGalleryCommentAction,
  deleteGalleryPostAction,
  getGalleryCommentsAction,
  getGalleryRepliesAction,
  shareGalleryPostAction,
  toggleGalleryCommentLikeAction,
  toggleGalleryLikeAction,
  togglePinGalleryPostAction,
  updateGalleryCommentAction,
  updateGalleryPostAction,
} from "@/libs/gallery/action";
import {
  GALLERY_CATEGORY_OPTIONS,
  type GalleryCommentForClient,
  type GalleryMentionUser,
  type GalleryPostForClient,
  type GalleryRealtimeEvent,
} from "@/types/gallery";

type GalleryInstagramModalProps = {
  post: GalleryPostForClient;
  mentionUsers: GalleryMentionUser[];
  activeImageIndex: number;
  onActiveImageChange: (index: number) => void;
  onClose: () => void;
  onPostChange: (post: GalleryPostForClient) => void;
};

type SheetMode = "peek" | "full";

type EditingComment = {
  id: string;
  parentId: string | null;
  text: string;
};

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}JT`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}RB`;

  return String(value);
}

function getCursorPosition(element: HTMLInputElement | HTMLTextAreaElement) {
  return element.selectionStart ?? element.value.length;
}

function uniqueComments(comments: GalleryCommentForClient[]) {
  const map = new Map<string, GalleryCommentForClient>();

  comments.forEach((comment) => {
    map.set(comment.id, comment);
  });

  return Array.from(map.values());
}

function prependUniqueComment(
  comments: GalleryCommentForClient[],
  comment: GalleryCommentForClient,
) {
  const exists = comments.some((item) => item.id === comment.id);

  if (exists) return comments;

  return [comment, ...comments];
}

function appendUniqueComment(
  comments: GalleryCommentForClient[],
  comment: GalleryCommentForClient,
) {
  const exists = comments.some((item) => item.id === comment.id);

  if (exists) return comments;

  return [...comments, comment];
}

function updateCommentTextInList(
  comments: GalleryCommentForClient[],
  commentId: string,
  text: string,
) {
  return comments.map((comment) =>
    comment.id === commentId
      ? {
          ...comment,
          text,
        }
      : comment,
  );
}

function updateCommentLikeInList(
  comments: GalleryCommentForClient[],
  commentId: string,
  likesCount: number,
) {
  return comments.map((comment) =>
    comment.id === commentId
      ? {
          ...comment,
          likesCount,
        }
      : comment,
  );
}

function removeCommentFromList(
  comments: GalleryCommentForClient[],
  commentId: string,
) {
  return comments.filter((comment) => comment.id !== commentId);
}

function getMentionKeyword(value: string, cursor: number) {
  const beforeCursor = value.slice(0, cursor);
  const lastAt = beforeCursor.lastIndexOf("@");

  if (lastAt === -1) return null;

  const keyword = beforeCursor.slice(lastAt + 1);

  if (/\s/.test(keyword)) return null;

  return keyword;
}

function insertMention(value: string, cursor: number, name: string) {
  const beforeCursor = value.slice(0, cursor);
  const afterCursor = value.slice(cursor);
  const lastAt = beforeCursor.lastIndexOf("@");

  if (lastAt === -1) {
    const nextValue = `${beforeCursor}@${name} ${afterCursor}`;

    return {
      value: nextValue,
      cursor: beforeCursor.length + name.length + 2,
    };
  }

  const nextValue = `${value.slice(0, lastAt)}@${name} ${afterCursor}`;

  return {
    value: nextValue,
    cursor: lastAt + name.length + 2,
  };
}

function getMentionSuggestions(
  value: string,
  cursor: number,
  mentionUsers: GalleryMentionUser[],
) {
  const keyword = getMentionKeyword(value, cursor);

  if (keyword === null) return [];

  const cleanKeyword = keyword.trim().toLowerCase();

  return mentionUsers
    .filter((user) => {
      if (!cleanKeyword) return true;

      return `${user.name} ${user.nim}`.toLowerCase().includes(cleanKeyword);
    })
    .slice(0, 6);
}

function renderTextWithMentions(
  text: string,
  mentionUsers: GalleryMentionUser[],
) {
  const candidates = Array.from(
    new Set(
      mentionUsers
        .flatMap((user) => [`@${user.name}`, `@${user.nim}`])
        .filter(Boolean),
    ),
  ).sort((a, b) => b.length - a.length);

  const result: ReactNode[] = [];
  let index = 0;
  let buffer = "";
  let key = 0;

  function flushBuffer() {
    if (!buffer) return;

    result.push(<span key={`text-${key++}`}>{buffer}</span>);
    buffer = "";
  }

  while (index < text.length) {
    const foundMention = candidates.find((candidate) =>
      text.startsWith(candidate, index),
    );

    if (foundMention) {
      flushBuffer();

      result.push(
        <span key={`mention-${key++}`} className="font-black text-blue-600">
          {foundMention}
        </span>,
      );

      index += foundMention.length;
      continue;
    }

    buffer += text[index];
    index += 1;
  }

  flushBuffer();

  return result;
}

function showToast(
  icon: "success" | "error" | "warning" | "info",
  title: string,
) {
  toast[icon](title);
}

export default function GalleryInstagramModal({
  post,
  mentionUsers,
  activeImageIndex,
  onActiveImageChange,
  onClose,
  onPostChange,
}: GalleryInstagramModalProps) {
  const router = useRouter();
  const { status } = useSession();

  const isLoggedIn = status === "authenticated";
  const activeImage = post.images[activeImageIndex] || post.images[0];

  const commentsRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const [liked, setLiked] = useState(post.likedByMe);
  const [saved, setSaved] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("peek");

  const [comments, setComments] = useState<GalleryCommentForClient[]>(() =>
    uniqueComments(post.commentsPreview),
  );

  const [commentsCursor, setCommentsCursor] = useState<string | null>(
    post.commentsPreview.length >= 3
      ? post.commentsPreview[post.commentsPreview.length - 1]?.id || null
      : null,
  );

  const [showLoadMoreCommentsButton, setShowLoadMoreCommentsButton] =
    useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const [repliesMap, setRepliesMap] = useState<
    Record<string, GalleryCommentForClient[]>
  >({});

  const [replyCursorMap, setReplyCursorMap] = useState<
    Record<string, string | null>
  >({});

  const [loadingReplyId, setLoadingReplyId] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] =
    useState<GalleryCommentForClient | null>(null);

  const [editingComment, setEditingComment] = useState<EditingComment | null>(
    null,
  );
  const [editCommentText, setEditCommentText] = useState("");
  const [editCommentCursor, setEditCommentCursor] = useState(0);
  const [editingCommentLoading, setEditingCommentLoading] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [commentCursor, setCommentCursor] = useState(0);

  const [editDescription, setEditDescription] = useState(
    post.description || "",
  );
  const [editDescriptionCursor, setEditDescriptionCursor] = useState(0);

  const [submittingComment, setSubmittingComment] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fullPostUrl = useMemo(() => {
    if (typeof window === "undefined") return "";

    return `${window.location.origin}/gallery?post=${post.id}`;
  }, [post.id]);

  const visibleComments = useMemo(() => {
    return uniqueComments(comments);
  }, [comments]);

  const commentMentionSuggestions = useMemo(() => {
    return getMentionSuggestions(commentText, commentCursor, mentionUsers);
  }, [commentCursor, commentText, mentionUsers]);

  const editCommentMentionSuggestions = useMemo(() => {
    return getMentionSuggestions(
      editCommentText,
      editCommentCursor,
      mentionUsers,
    );
  }, [editCommentCursor, editCommentText, mentionUsers]);

  const editMentionSuggestions = useMemo(() => {
    return getMentionSuggestions(
      editDescription,
      editDescriptionCursor,
      mentionUsers,
    );
  }, [editDescription, editDescriptionCursor, mentionUsers]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const oldHtmlOverflow = html.style.overflow;
    const oldBodyOverflow = body.style.overflow;
    const oldBodyPosition = body.style.position;
    const oldBodyWidth = body.style.width;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "relative";
    body.style.width = "100%";

    return () => {
      html.style.overflow = oldHtmlOverflow;
      body.style.overflow = oldBodyOverflow;
      body.style.position = oldBodyPosition;
      body.style.width = oldBodyWidth;
    };
  }, []);

  useEffect(() => {
    setLiked(post.likedByMe);
  }, [post.likedByMe]);

  useEffect(() => {
    setSaved(false);
    setHeartBurst(false);

    setMenuOpen(false);
    setEditOpen(false);
    setEditDescription(post.description || "");
    setEditDescriptionCursor(0);

    setCommentsOpen(false);
    setSheetMode("peek");

    setComments(uniqueComments(post.commentsPreview));
    setCommentsCursor(
      post.commentsPreview.length >= 3
        ? post.commentsPreview[post.commentsPreview.length - 1]?.id || null
        : null,
    );
    setShowLoadMoreCommentsButton(false);

    setRepliesMap({});
    setReplyCursorMap({});
    setLoadingReplyId(null);
    setReplyTarget(null);

    setEditingComment(null);
    setEditCommentText("");
    setEditCommentCursor(0);
    setEditingCommentLoading(false);

    setCommentText("");
    setCommentCursor(0);
    setSubmittingComment(false);

    setShareOpen(false);
    setShareStatus("");
    setActionLoading(false);
    // Reset state modal hanya ketika berpindah post.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  useEffect(() => {
    const eventSource = new EventSource("/api/realtime/gallery");

    eventSource.addEventListener("gallery-event", (event) => {
      const payload = JSON.parse(
        (event as MessageEvent).data,
      ) as GalleryRealtimeEvent;

      if (payload.type === "POST_DELETED" && payload.postId === post.id) {
        onClose();
        return;
      }

      if ("postId" in payload && payload.postId !== post.id) return;

      if (payload.type === "POST_LIKED") {
        onPostChange({
          ...post,
          likesCount: payload.likesCount,
        });
      }

      if (payload.type === "POST_SHARED") {
        onPostChange({
          ...post,
          sharesCount: payload.sharesCount,
        });
      }

      if (payload.type === "POST_PINNED") {
        onPostChange({
          ...post,
          isPinned: payload.isPinned,
        });
      }

      if (payload.type === "POST_UPDATED") {
        onPostChange({
          ...post,
          title: payload.title,
          description: payload.description,
          category: payload.category,
        });
      }

      if (payload.type === "COMMENT_CREATED") {
        setComments((prev) => prependUniqueComment(prev, payload.comment));

        onPostChange({
          ...post,
          commentsCount: payload.commentsCount,
          commentsPreview: prependUniqueComment(
            post.commentsPreview,
            payload.comment,
          ),
        });
      }

      if (payload.type === "COMMENT_REPLIED") {
        setRepliesMap((prev) => {
          const oldReplies = prev[payload.parentId] || [];

          return {
            ...prev,
            [payload.parentId]: appendUniqueComment(oldReplies, payload.reply),
          };
        });

        setComments((prev) =>
          prev.map((comment) =>
            comment.id === payload.parentId
              ? {
                  ...comment,
                  repliesCount: Math.max(0, comment.repliesCount + 1),
                }
              : comment,
          ),
        );

        onPostChange({
          ...post,
          commentsCount: payload.commentsCount,
        });
      }

      if (payload.type === "COMMENT_UPDATED") {
        setComments((prev) =>
          updateCommentTextInList(prev, payload.commentId, payload.text),
        );

        setRepliesMap((prev) => {
          const next = { ...prev };

          Object.keys(next).forEach((parentId) => {
            next[parentId] = updateCommentTextInList(
              next[parentId],
              payload.commentId,
              payload.text,
            );
          });

          return next;
        });
      }

      if (payload.type === "COMMENT_DELETED") {
        if (payload.parentId) {
          const parentId = payload.parentId;

          setRepliesMap((prev) => ({
            ...prev,
            [parentId]: removeCommentFromList(
              prev[parentId] || [],
              payload.commentId,
            ),
          }));

          setComments((prev) =>
            prev.map((comment) =>
              comment.id === parentId
                ? {
                    ...comment,
                    repliesCount: Math.max(0, comment.repliesCount - 1),
                  }
                : comment,
            ),
          );
        } else {
          setComments((prev) => removeCommentFromList(prev, payload.commentId));

          setRepliesMap((prev) => {
            const next = { ...prev };
            delete next[payload.commentId];
            return next;
          });
        }

        onPostChange({
          ...post,
          commentsCount: payload.commentsCount,
          commentsPreview: removeCommentFromList(
            post.commentsPreview,
            payload.commentId,
          ),
        });
      }

      if (payload.type === "COMMENT_LIKED") {
        setComments((prev) =>
          updateCommentLikeInList(prev, payload.commentId, payload.likesCount),
        );

        setRepliesMap((prev) => {
          const next = { ...prev };

          Object.keys(next).forEach((parentId) => {
            next[parentId] = updateCommentLikeInList(
              next[parentId],
              payload.commentId,
              payload.likesCount,
            );
          });

          return next;
        });
      }
    });

    return () => {
      eventSource.close();
    };
  }, [onClose, onPostChange, post]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editOpen) {
          setEditOpen(false);
          return;
        }

        if (commentsOpen) {
          closeComments();
          return;
        }

        if (shareOpen) {
          setShareOpen(false);
          return;
        }

        onClose();
      }

      if (e.key === "ArrowRight") {
        nextImage();
      }

      if (e.key === "ArrowLeft") {
        prevImage();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  function disabledClass() {
    return !isLoggedIn ? "cursor-not-allowed opacity-40" : "active:scale-95";
  }

  function nextImage() {
    onActiveImageChange(
      activeImageIndex >= post.images.length - 1 ? 0 : activeImageIndex + 1,
    );
  }

  function prevImage() {
    onActiveImageChange(
      activeImageIndex <= 0 ? post.images.length - 1 : activeImageIndex - 1,
    );
  }

  function selectCommentMention(user: GalleryMentionUser) {
    const inserted = insertMention(commentText, commentCursor, user.name);

    setCommentText(inserted.value);
    setCommentCursor(inserted.cursor);
  }

  function selectEditCommentMention(user: GalleryMentionUser) {
    const inserted = insertMention(
      editCommentText,
      editCommentCursor,
      user.name,
    );

    setEditCommentText(inserted.value);
    setEditCommentCursor(inserted.cursor);
  }

  function selectEditMention(user: GalleryMentionUser) {
    const inserted = insertMention(
      editDescription,
      editDescriptionCursor,
      user.name,
    );

    setEditDescription(inserted.value);
    setEditDescriptionCursor(inserted.cursor);
  }

  function handleNotLogin() {
    showToast("warning", "Login dulu untuk memakai fitur ini.");
  }

  async function handleLike() {
    if (!isLoggedIn) {
      handleNotLogin();
      return;
    }

    const previousLiked = liked;
    const previousCount = post.likesCount;

    setLiked(!previousLiked);

    onPostChange({
      ...post,
      likedByMe: !previousLiked,
      likesCount: previousLiked
        ? Math.max(0, post.likesCount - 1)
        : post.likesCount + 1,
    });

    const result = await toggleGalleryLikeAction(post.id);

    if (!result.success || !result.data) {
      setLiked(previousLiked);
      onPostChange({
        ...post,
        likedByMe: previousLiked,
        likesCount: previousCount,
      });
      showToast("error", result.message);
      return;
    }

    setLiked(result.data.liked);

    onPostChange({
      ...post,
      likedByMe: result.data.liked,
      likesCount: result.data.likesCount,
    });
  }

  async function handleDoubleLike() {
    if (!isLoggedIn) {
      handleNotLogin();
      return;
    }

    setHeartBurst(true);

    window.setTimeout(() => {
      setHeartBurst(false);
    }, 650);

    if (liked) return;

    await handleLike();
  }

  async function handleShare() {
    if (!isLoggedIn) {
      handleNotLogin();
      return;
    }

    setShareOpen(true);

    try {
      await navigator.clipboard.writeText(fullPostUrl);

      const result = await shareGalleryPostAction(post.id);

      if (result.success && result.data) {
        onPostChange({
          ...post,
          sharesCount: result.data.sharesCount,
        });
      }

      setShareStatus("Link disalin");
    } catch {
      setShareStatus("Gagal menyalin link");
    }
  }

  async function handleDownload() {
    if (!isLoggedIn) {
      handleNotLogin();
      return;
    }

    if (!activeImage?.url) return;

    try {
      const response = await fetch(
        `/api/gallery/download?url=${encodeURIComponent(activeImage.url)}`,
      );

      if (!response.ok) {
        throw new Error("Download gagal.");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${post.title || "gallery"}-${activeImageIndex + 1}.webp`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    } catch {
      showToast("error", "Gagal download foto.");
    }
  }

  function openComments() {
    if (!isLoggedIn) {
      handleNotLogin();
      return;
    }

    setCommentsOpen(true);
    setSheetMode("peek");
    setShowLoadMoreCommentsButton(false);
  }

  function closeComments() {
    setCommentsOpen(false);
    setSheetMode("peek");
    setReplyTarget(null);
    setEditingComment(null);
    setEditCommentText("");
    setEditCommentCursor(0);
    setCommentText("");
    setCommentCursor(0);
    setShowLoadMoreCommentsButton(false);
  }

  async function loadMoreComments() {
    if (loadingComments) return;
    if (!commentsCursor) return;

    setLoadingComments(true);

    const result = await getGalleryCommentsAction(post.id, commentsCursor);

    if (result.success && result.data) {
      setComments((prev) =>
        uniqueComments([...prev, ...result.data!.comments]),
      );

      setCommentsCursor(result.data.nextCursor);
      setShowLoadMoreCommentsButton(false);
    } else {
      showToast("error", result.message);
    }

    setLoadingComments(false);
  }

  async function loadReplies(commentId: string) {
    if (loadingReplyId) return;

    setLoadingReplyId(commentId);

    const result = await getGalleryRepliesAction(
      commentId,
      replyCursorMap[commentId] || null,
    );

    if (result.success && result.data) {
      setRepliesMap((prev) => {
        const oldReplies = prev[commentId] || [];

        return {
          ...prev,
          [commentId]: uniqueComments([
            ...oldReplies,
            ...result.data!.comments,
          ]),
        };
      });

      setReplyCursorMap((prev) => ({
        ...prev,
        [commentId]: result.data!.nextCursor,
      }));
    } else {
      showToast("error", result.message);
    }

    setLoadingReplyId(null);
  }

  function handleCommentsScroll() {
    const element = commentsRef.current;

    if (!element) return;

    const nearBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 90;

    if (nearBottom && commentsCursor) {
      setShowLoadMoreCommentsButton(true);
    }
  }

  function handleSheetTouchStart(e: TouchEvent<HTMLDivElement>) {
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  }

  function handleSheetTouchEnd(e: TouchEvent<HTMLDivElement>) {
    const start = touchStartYRef.current;
    const end = e.changedTouches[0]?.clientY ?? null;

    if (start === null || end === null) return;

    const diff = start - end;

    if (diff > 55) {
      setSheetMode("full");
    }

    if (diff < -55) {
      if (sheetMode === "full") {
        setSheetMode("peek");
      } else {
        closeComments();
      }
    }

    touchStartYRef.current = null;
  }

  async function handleSubmitComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isLoggedIn) {
      handleNotLogin();
      return;
    }

    const text = commentText.trim();

    if (!text) return;

    setSubmittingComment(true);

    const result = await createGalleryCommentAction(
      post.id,
      text,
      replyTarget?.id || null,
    );

    if (result.success && result.data) {
      if (replyTarget) {
        setRepliesMap((prev) => ({
          ...prev,
          [replyTarget.id]: appendUniqueComment(
            prev[replyTarget.id] || [],
            result.data!,
          ),
        }));

        setComments((prev) =>
          prev.map((comment) =>
            comment.id === replyTarget.id
              ? {
                  ...comment,
                  repliesCount: comment.repliesCount + 1,
                }
              : comment,
          ),
        );
      } else {
        setComments((prev) => prependUniqueComment(prev, result.data!));
      }

      onPostChange({
        ...post,
        commentsCount: post.commentsCount + 1,
        commentsPreview: replyTarget
          ? post.commentsPreview
          : prependUniqueComment(post.commentsPreview, result.data),
      });

      setCommentText("");
      setCommentCursor(0);
      setReplyTarget(null);

      showToast(
        "success",
        replyTarget ? "Balasan terkirim." : "Komentar terkirim.",
      );
    } else {
      showToast("error", result.message);
    }

    setSubmittingComment(false);
  }

  async function handleCommentLike(
    commentId: string,
    parentId?: string | null,
  ) {
    if (!isLoggedIn) {
      handleNotLogin();
      return;
    }

    const result = await toggleGalleryCommentLikeAction(commentId);

    if (!result.success || !result.data) {
      showToast("error", result.message);
      return;
    }

    const updater = (comment: GalleryCommentForClient) =>
      comment.id === commentId
        ? {
            ...comment,
            likedByMe: result.data!.liked,
            likesCount: result.data!.likesCount,
          }
        : comment;

    if (parentId) {
      setRepliesMap((prev) => ({
        ...prev,
        [parentId]: (prev[parentId] || []).map(updater),
      }));
    } else {
      setComments((prev) => prev.map(updater));
    }
  }

  function startEditComment(comment: GalleryCommentForClient) {
    if (!isLoggedIn) {
      handleNotLogin();
      return;
    }

    setEditingComment({
      id: comment.id,
      parentId: comment.parentId,
      text: comment.text,
    });

    setEditCommentText(comment.text);
    setEditCommentCursor(comment.text.length);
    setReplyTarget(null);

    if (window.innerWidth < 768) {
      setCommentsOpen(true);
      setSheetMode("full");
    }
  }

  async function handleSaveEditComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingComment) return;

    const cleanText = editCommentText.trim();

    if (!cleanText) return;

    setEditingCommentLoading(true);

    const result = await updateGalleryCommentAction(
      editingComment.id,
      cleanText,
    );

    if (!result.success || !result.data) {
      setEditingCommentLoading(false);
      showToast("error", result.message);
      return;
    }

    const parentId = editingComment.parentId;

    if (parentId) {
      setRepliesMap((prev) => ({
        ...prev,
        [parentId]: updateCommentTextInList(
          prev[parentId] || [],
          editingComment.id,
          cleanText,
        ),
      }));
    } else {
      setComments((prev) =>
        updateCommentTextInList(prev, editingComment.id, cleanText),
      );
    }

    setEditingComment(null);
    setEditCommentText("");
    setEditCommentCursor(0);
    setEditingCommentLoading(false);

    showToast("success", "Komentar berhasil diedit.");
  }

  async function handleDeleteComment(comment: GalleryCommentForClient) {
    if (!isLoggedIn) {
      handleNotLogin();
      return;
    }

    const confirmed = await confirmDanger(
      "Hapus komentar?",
      comment.parentId
        ? "Balasan ini akan dihapus."
        : "Komentar dan semua balasannya akan dihapus.",
    );

    if (!confirmed) return;

    const result = await deleteGalleryCommentAction(comment.id);

    if (!result.success || !result.data) {
      showToast("error", result.message);
      return;
    }

    const parentId = result.data.parentId;
    const deletedCommentId = result.data.commentId;

    if (parentId) {
      setRepliesMap((prev) => ({
        ...prev,
        [parentId]: removeCommentFromList(
          prev[parentId] || [],
          deletedCommentId,
        ),
      }));

      setComments((prev) =>
        prev.map((item) =>
          item.id === parentId
            ? {
                ...item,
                repliesCount: Math.max(0, item.repliesCount - 1),
              }
            : item,
        ),
      );
    } else {
      setComments((prev) => removeCommentFromList(prev, deletedCommentId));

      setRepliesMap((prev) => {
        const next = { ...prev };
        delete next[deletedCommentId];
        return next;
      });
    }

    onPostChange({
      ...post,
      commentsCount: result.data.commentsCount,
      commentsPreview: removeCommentFromList(
        post.commentsPreview,
        deletedCommentId,
      ),
    });

    showToast("success", "Komentar berhasil dihapus.");
  }

  async function handleDeletePost() {
    if (!post.canDelete) return;

    const confirmed = await confirmDanger(
      "Hapus postingan?",
      "Postingan dan semua komentar akan dihapus.",
    );

    if (!confirmed) return;

    setActionLoading(true);

    const result = await deleteGalleryPostAction(post.id);

    if (!result.success) {
      showToast("error", result.message);
      setActionLoading(false);
      return;
    }

    setActionLoading(false);
    showToast("success", "Postingan berhasil dihapus.");
    onClose();
    router.refresh();
  }

  async function handlePinPost() {
    if (!post.canPin) return;

    setActionLoading(true);

    const result = await togglePinGalleryPostAction(post.id);

    if (!result.success || !result.data) {
      showToast("error", result.message);
      setActionLoading(false);
      return;
    }

    onPostChange({
      ...post,
      isPinned: result.data.isPinned,
    });

    setActionLoading(false);
    setMenuOpen(false);
    router.refresh();

    showToast(
      "success",
      result.data.isPinned
        ? "Postingan berhasil dipin."
        : "Pin postingan dilepas.",
    );
  }

  async function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!post.canEdit) return;

    setActionLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("description", editDescription);

    const result = await updateGalleryPostAction(post.id, formData);

    if (!result.success) {
      showToast("error", result.message);
      setActionLoading(false);
      return;
    }

    onPostChange({
      ...post,
      title: String(formData.get("title") || post.title),
      description: String(formData.get("description") || ""),
      category: String(formData.get("category") || post.category),
    });

    setActionLoading(false);
    setEditOpen(false);
    setMenuOpen(false);
    router.refresh();

    showToast("success", "Postingan berhasil diedit.");
  }

  function MentionSuggestions({
    suggestions,
    onSelect,
  }: {
    suggestions: GalleryMentionUser[];
    onSelect: (user: GalleryMentionUser) => void;
  }) {
    if (suggestions.length === 0) return null;

    return (
      <div className="gallery-hidden-scroll absolute bottom-full left-0 right-0 z-30 mb-2 max-h-56 overflow-y-auto rounded-2xl border border-blue-100 bg-white p-2 shadow-2xl">
        {suggestions.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect(user)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-blue-50"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">
              {user.avatarText}
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-slate-900">
                {user.name}
              </span>
              <span className="block truncate text-xs font-semibold text-slate-400">
                {user.nim}
              </span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  function renderCommentItem(
    comment: GalleryCommentForClient,
    parentId: string | null = null,
    isReply = false,
  ) {
    const replies = uniqueComments(repliesMap[comment.id] || []);

    const hasMoreReplies =
      !isReply &&
      comment.repliesCount > replies.length &&
      replyCursorMap[comment.id] !== null;

    const isEditing = editingComment?.id === comment.id;

    return (
      <div key={comment.id} className={isReply ? "ml-10" : ""}>
        <div className="flex gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">
            {comment.avatarText}
          </div>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <form onSubmit={handleSaveEditComment} className="relative">
                <MentionSuggestions
                  suggestions={editCommentMentionSuggestions}
                  onSelect={selectEditCommentMention}
                />

                <div className="rounded-2xl bg-blue-50/70 px-3 py-2">
                  <textarea
                    value={editCommentText}
                    onChange={(e) => {
                      setEditCommentText(e.target.value);
                      setEditCommentCursor(getCursorPosition(e.target));
                    }}
                    onClick={(e) =>
                      setEditCommentCursor(getCursorPosition(e.currentTarget))
                    }
                    onKeyUp={(e) =>
                      setEditCommentCursor(getCursorPosition(e.currentTarget))
                    }
                    rows={2}
                    autoFocus
                    className="gallery-hidden-scroll block w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                  />

                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingComment(null);
                        setEditCommentText("");
                        setEditCommentCursor(0);
                      }}
                      disabled={editingCommentLoading}
                      className="rounded-xl px-3 py-1.5 text-xs font-black text-slate-500 hover:bg-white disabled:opacity-50"
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      disabled={
                        !editCommentText.trim() || editingCommentLoading
                      }
                      className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700 disabled:bg-slate-300"
                    >
                      {editingCommentLoading ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm leading-6 text-slate-700">
                  <span className="font-black text-slate-950">
                    {comment.user}
                  </span>{" "}
                  <span>
                    {renderTextWithMentions(comment.text, mentionUsers)}
                  </span>
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
                  <span>{comment.createdAt}</span>
                  <span>{formatNumber(comment.likesCount)} suka</span>

                  {isLoggedIn && !isReply && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTarget(comment);
                        setEditingComment(null);
                        setCommentsOpen(true);
                      }}
                      className="font-black hover:text-blue-600"
                    >
                      Balas
                    </button>
                  )}

                  {comment.canEdit && (
                    <button
                      type="button"
                      onClick={() => startEditComment(comment)}
                      className="inline-flex items-center gap-1 font-black hover:text-blue-600"
                    >
                      <FiEdit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}

                  {comment.canDelete && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteComment(comment)}
                      className="inline-flex items-center gap-1 font-black text-rose-500 hover:text-rose-600"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  )}
                </div>

                {!isReply && comment.repliesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void loadReplies(comment.id)}
                    className="mt-2 text-xs font-black text-blue-600"
                  >
                    {replies.length > 0
                      ? hasMoreReplies
                        ? "Muat balasan lainnya"
                        : "Balasan sudah dimuat"
                      : `Lihat ${comment.repliesCount} balasan`}
                  </button>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            disabled={!isLoggedIn}
            onClick={() => handleCommentLike(comment.id, parentId)}
            className={`transition ${
              comment.likedByMe
                ? "text-rose-500"
                : "text-slate-300 hover:text-rose-500"
            } ${!isLoggedIn ? "cursor-not-allowed opacity-40" : ""}`}
          >
            <FiHeart
              className={`h-5 w-5 ${comment.likedByMe ? "fill-current" : ""}`}
            />
          </button>
        </div>

        {loadingReplyId === comment.id && (
          <div className="ml-12 mt-3">
            <FiLoader className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        )}

        {replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {replies.map((reply) => renderCommentItem(reply, comment.id, true))}
          </div>
        )}
      </div>
    );
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] bg-slate-950/50 text-slate-900 md:flex md:items-center md:justify-center md:bg-slate-950/75 md:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-[100dvh] w-full max-w-full flex-col overflow-hidden bg-white md:h-[88vh] md:w-full md:max-w-6xl md:grid md:grid-cols-[minmax(0,1.35fr)_25rem] md:rounded-[1.6rem]">
        <section className="flex min-h-0 flex-1 flex-col bg-white text-slate-900">
          <div className="flex shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-4 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] md:hidden">
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-900 active:scale-95"
            >
              <FiChevronLeft className="h-8 w-8" />
            </button>

            <h2 className="text-2xl font-black">Postingan</h2>
          </div>

          <div className="flex shrink-0 items-center justify-between bg-white px-4 py-3 md:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-xs font-black text-white">
                {post.uploadedByAvatarText}
              </div>

              <div className="min-w-0">
                <p className="truncate text-lg font-black text-slate-950">
                  {post.uploadedBy}
                  {post.images.length > 1
                    ? ` dan ${post.images.length - 1} lainnya`
                    : ""}
                </p>

                <p className="truncate text-sm font-semibold text-slate-500">
                  {post.uploadedByRole}
                  {post.isPinned ? " · Dipin" : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!isLoggedIn}
              onClick={() => setMenuOpen((prev) => !prev)}
              className={`grid h-10 w-10 place-items-center rounded-full text-slate-700 hover:bg-slate-100 ${
                !isLoggedIn ? "cursor-not-allowed opacity-40" : ""
              }`}
            >
              <FiMoreHorizontal className="h-6 w-6" />
            </button>
          </div>

          <div className="relative flex shrink-0 items-center justify-center bg-slate-100 md:min-h-0 md:flex-1 md:bg-slate-950">
            <button
              type="button"
              disabled={!isLoggedIn}
              onDoubleClick={handleDoubleLike}
              className="relative aspect-square w-full bg-slate-100 md:h-full md:aspect-auto md:bg-slate-950"
              aria-label="Double tap untuk like"
            >
              {activeImage && (
                <Image
                  src={getDisplayImageUrl(activeImage.url)}
                  alt={post.title}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 70vw"
                  className="object-contain"
                />
              )}

              {heartBurst && (
                <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
                  <FiHeart className="heart-burst h-24 w-24 fill-current text-rose-500 drop-shadow-2xl" />
                </div>
              )}
            </button>

            {post.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-950 shadow-lg active:scale-95"
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-950 shadow-lg active:scale-95"
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>

                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-3 py-2 backdrop-blur-xl">
                  {post.images.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => onActiveImageChange(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === activeImageIndex
                          ? "w-5 bg-white"
                          : "w-2 bg-white/45"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="gallery-hidden-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  disabled={!isLoggedIn}
                  onClick={handleLike}
                  className={`flex items-center gap-2 text-lg font-bold text-slate-900 ${disabledClass()}`}
                >
                  <FiHeart
                    className={`h-8 w-8 ${
                      liked ? "fill-current text-rose-500" : ""
                    }`}
                  />
                  {formatNumber(post.likesCount)}
                </button>

                <button
                  type="button"
                  disabled={!isLoggedIn}
                  onClick={openComments}
                  className={`flex items-center gap-2 text-lg font-bold text-slate-900 ${disabledClass()}`}
                >
                  <FiMessageCircle className="h-8 w-8" />
                  {formatNumber(post.commentsCount)}
                </button>

                <button
                  type="button"
                  disabled={!isLoggedIn}
                  onClick={handleShare}
                  className={`flex items-center gap-2 text-lg font-bold text-slate-900 ${disabledClass()}`}
                >
                  <FiShare2 className="h-8 w-8" />
                  {formatNumber(post.sharesCount)}
                </button>

                <button
                  type="button"
                  disabled={!isLoggedIn}
                  onClick={handleDownload}
                  className={`flex items-center gap-2 text-lg font-bold text-slate-900 ${disabledClass()}`}
                  title="Download foto"
                >
                  <FiDownload className="h-8 w-8" />
                </button>
              </div>

              <button
                type="button"
                disabled={!isLoggedIn}
                onClick={() => {
                  if (!isLoggedIn) return;
                  setSaved((prev) => !prev);
                }}
                className={`${saved ? "text-blue-600" : "text-slate-900"} ${disabledClass()}`}
              >
                <FiBookmark
                  className={`h-8 w-8 ${saved ? "fill-current" : ""}`}
                />
              </button>
            </div>

            {!isLoggedIn && (
              <p className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                Login dulu untuk like, komentar, share, download, dan simpan
                postingan.
              </p>
            )}

            <div className="mt-5">
              <p className="text-base leading-7 text-slate-700">
                <span className="font-black text-slate-950">
                  {post.uploadedBy}
                </span>{" "}
                {renderTextWithMentions(
                  post.description || post.title,
                  mentionUsers,
                )}
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-400">
                {post.uploadedAt}
              </p>
            </div>

            {isLoggedIn && post.commentsCount > 0 && (
              <button
                type="button"
                onClick={openComments}
                className="mt-4 text-base font-semibold text-slate-500"
              >
                Lihat semua {formatNumber(post.commentsCount)} komentar
              </button>
            )}

            {isLoggedIn && post.commentsPreview[0] && (
              <button
                type="button"
                onClick={openComments}
                className="mt-3 block text-left text-base leading-7"
              >
                <span className="font-black text-slate-950">
                  {post.commentsPreview[0].user}
                </span>{" "}
                <span className="text-slate-700">
                  {renderTextWithMentions(
                    post.commentsPreview[0].text,
                    mentionUsers,
                  )}
                </span>
              </button>
            )}
          </div>
        </section>

        <aside className="hidden min-h-0 flex-col bg-white text-slate-900 md:flex">
          <div className="shrink-0 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-sm font-black text-white">
                  {post.uploadedByAvatarText}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    {post.uploadedBy}
                  </p>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {post.uploadedByRole} · {post.uploadedAt}
                    {post.isPinned ? " · Dipin" : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!isLoggedIn}
                onClick={() => setMenuOpen((prev) => !prev)}
                className={`grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 ${
                  !isLoggedIn ? "cursor-not-allowed opacity-40" : ""
                }`}
              >
                <FiMoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="gallery-hidden-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <p className="text-sm leading-6 text-slate-700">
              <span className="font-black text-slate-950">
                {post.uploadedBy}
              </span>{" "}
              {renderTextWithMentions(
                post.description || post.title,
                mentionUsers,
              )}
            </p>

            <div className="mt-4 space-y-4">
              {visibleComments
                .slice(0, 8)
                .map((comment) => renderCommentItem(comment))}
            </div>

            {commentsCursor && showLoadMoreCommentsButton && (
              <button
                type="button"
                onClick={loadMoreComments}
                className="mt-4 w-full rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100"
              >
                Muat komentar lainnya
              </button>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={!isLoggedIn}
                  onClick={handleLike}
                  className={`transition hover:scale-110 ${
                    liked ? "text-rose-500" : "text-slate-900"
                  } ${!isLoggedIn ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  <FiHeart
                    className={`h-6 w-6 ${liked ? "fill-current" : ""}`}
                  />
                </button>

                <button
                  type="button"
                  disabled={!isLoggedIn}
                  onClick={openComments}
                  className={`text-slate-900 transition hover:scale-110 hover:text-blue-600 ${
                    !isLoggedIn ? "cursor-not-allowed opacity-40" : ""
                  }`}
                >
                  <FiMessageCircle className="h-6 w-6" />
                </button>

                <button
                  type="button"
                  disabled={!isLoggedIn}
                  onClick={handleShare}
                  className={`text-slate-900 transition hover:scale-110 hover:text-blue-600 ${
                    !isLoggedIn ? "cursor-not-allowed opacity-40" : ""
                  }`}
                >
                  <FiShare2 className="h-6 w-6" />
                </button>

                <button
                  type="button"
                  disabled={!isLoggedIn}
                  onClick={handleDownload}
                  className={`text-slate-900 transition hover:scale-110 hover:text-blue-600 ${
                    !isLoggedIn ? "cursor-not-allowed opacity-40" : ""
                  }`}
                  title="Download foto"
                >
                  <FiDownload className="h-6 w-6" />
                </button>
              </div>

              <button
                type="button"
                disabled={!isLoggedIn}
                onClick={() => {
                  if (!isLoggedIn) return;
                  setSaved((prev) => !prev);
                }}
                className={`${saved ? "text-blue-600" : "text-slate-900"} ${
                  !isLoggedIn ? "cursor-not-allowed opacity-40" : ""
                }`}
              >
                <FiBookmark
                  className={`h-6 w-6 ${saved ? "fill-current" : ""}`}
                />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-slate-50 px-3 py-2">
                <p className="text-sm font-black">
                  {formatNumber(post.likesCount)}
                </p>
                <p className="text-[11px] font-bold text-slate-500">Like</p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-3 py-2">
                <p className="text-sm font-black">
                  {formatNumber(post.commentsCount)}
                </p>
                <p className="text-[11px] font-bold text-slate-500">Komentar</p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-3 py-2">
                <p className="text-sm font-black">
                  {formatNumber(post.sharesCount)}
                </p>
                <p className="text-[11px] font-bold text-slate-500">Share</p>
              </div>
            </div>

            {replyTarget && (
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                <span>Membalas {replyTarget.user}</span>
                <button type="button" onClick={() => setReplyTarget(null)}>
                  Batal
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitComment} className="relative mt-3">
              <MentionSuggestions
                suggestions={commentMentionSuggestions}
                onSelect={selectCommentMention}
              />

              <div className="flex items-center gap-3">
                <input
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    setCommentCursor(getCursorPosition(e.target));
                  }}
                  onClick={(e) =>
                    setCommentCursor(getCursorPosition(e.currentTarget))
                  }
                  onKeyUp={(e) =>
                    setCommentCursor(getCursorPosition(e.currentTarget))
                  }
                  disabled={!isLoggedIn}
                  placeholder={
                    isLoggedIn
                      ? replyTarget
                        ? `Balas ${replyTarget.user}...`
                        : "Tambahkan komentar... pakai @ untuk tag orang"
                      : "Login untuk komentar"
                  }
                  className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 caret-blue-600 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={
                    !isLoggedIn || !commentText.trim() || submittingComment
                  }
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submittingComment ? (
                    <FiLoader className="h-5 w-5 animate-spin" />
                  ) : (
                    <FiSend className="h-5 w-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </aside>

        {menuOpen && (
          <div className="absolute right-4 top-24 z-[1005] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-950/20 md:right-5 md:top-16">
            {post.canEdit && (
              <button
                type="button"
                onClick={() => {
                  setEditOpen(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold hover:bg-blue-50"
              >
                <FiEdit3 />
                Edit postingan
              </button>
            )}

            {post.canPin && (
              <button
                type="button"
                onClick={handlePinPost}
                disabled={actionLoading}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold hover:bg-blue-50 disabled:opacity-60"
              >
                {actionLoading ? (
                  <FiLoader className="animate-spin" />
                ) : (
                  <FiBookmark />
                )}
                {post.isPinned ? "Lepas pin" : "Pin postingan"}
              </button>
            )}

            {post.canDelete && (
              <button
                type="button"
                onClick={handleDeletePost}
                disabled={actionLoading}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-rose-500 hover:bg-rose-50 disabled:opacity-60"
              >
                {actionLoading ? (
                  <FiLoader className="animate-spin" />
                ) : (
                  <FiTrash2 />
                )}
                Hapus postingan
              </button>
            )}

            {!post.canEdit && !post.canDelete && !post.canPin && (
              <p className="px-4 py-3 text-sm font-semibold text-slate-400">
                Tidak ada aksi.
              </p>
            )}
          </div>
        )}
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-[1020] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm md:items-center md:p-5">
          <form
            onSubmit={handleEditSubmit}
            className="w-full rounded-t-[2rem] bg-white p-5 text-slate-900 shadow-2xl shadow-black/20 md:max-w-xl md:rounded-[2rem]"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
                  Edit Postingan
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">
                  Ubah Detail Post
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={actionLoading}
                className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                name="title"
                defaultValue={post.title}
                required
                placeholder="Judul"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />

              <select
                name="category"
                defaultValue={post.category}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                {GALLERY_CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <div className="relative">
                <MentionSuggestions
                  suggestions={editMentionSuggestions}
                  onSelect={selectEditMention}
                />

                <textarea
                  name="description"
                  value={editDescription}
                  onChange={(e) => {
                    setEditDescription(e.target.value);
                    setEditDescriptionCursor(getCursorPosition(e.target));
                  }}
                  onClick={(e) =>
                    setEditDescriptionCursor(getCursorPosition(e.currentTarget))
                  }
                  onKeyUp={(e) =>
                    setEditDescriptionCursor(getCursorPosition(e.currentTarget))
                  }
                  rows={5}
                  placeholder="Caption, pakai @ untuk tag orang"
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={actionLoading}
                className="flex-1 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {commentsOpen && (
        <div className="fixed inset-0 z-[1010] flex items-end justify-center bg-slate-950/35 md:hidden">
          <div
            className={`flex w-full max-w-full flex-col overflow-hidden rounded-t-[2rem] bg-white text-slate-900 shadow-2xl shadow-slate-950/20 transition-all duration-300 ${
              sheetMode === "full" ? "h-[94dvh]" : "h-[62dvh]"
            }`}
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={handleSheetTouchEnd}
          >
            <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setSheetMode((prev) => (prev === "full" ? "peek" : "full"))
                }
                className="mx-auto mb-3 block h-1.5 w-14 rounded-full bg-slate-300"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={closeComments}
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100"
                >
                  <FiChevronLeft className="h-6 w-6" />
                </button>

                <h3 className="text-xl font-black">Komentar</h3>

                <button
                  type="button"
                  onClick={closeComments}
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div
              ref={commentsRef}
              onScroll={handleCommentsScroll}
              className="gallery-hidden-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4"
            >
              <div className="space-y-5">
                {visibleComments.length > 0 ? (
                  visibleComments.map((comment) => renderCommentItem(comment))
                ) : (
                  <div className="rounded-2xl border border-dashed border-blue-100 bg-blue-50/50 p-5 text-center">
                    <p className="text-sm font-black text-slate-900">
                      Belum ada komentar
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Jadilah yang pertama memberi komentar.
                    </p>
                  </div>
                )}

                {loadingComments && (
                  <div className="flex justify-center py-3">
                    <FiLoader className="h-5 w-5 animate-spin text-blue-500" />
                  </div>
                )}

                {commentsCursor &&
                  showLoadMoreCommentsButton &&
                  !loadingComments && (
                    <button
                      type="button"
                      onClick={loadMoreComments}
                      className="w-full rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100"
                    >
                      Muat komentar lainnya
                    </button>
                  )}
              </div>
            </div>

            <form
              onSubmit={handleSubmitComment}
              className="relative shrink-0 border-t border-slate-100 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <MentionSuggestions
                suggestions={commentMentionSuggestions}
                onSelect={selectCommentMention}
              />

              {replyTarget && (
                <div className="mb-2 flex items-center justify-between rounded-2xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                  <span>Membalas {replyTarget.user}</span>
                  <button type="button" onClick={() => setReplyTarget(null)}>
                    Batal
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    setCommentCursor(getCursorPosition(e.target));
                  }}
                  onClick={(e) =>
                    setCommentCursor(getCursorPosition(e.currentTarget))
                  }
                  onKeyUp={(e) =>
                    setCommentCursor(getCursorPosition(e.currentTarget))
                  }
                  disabled={!isLoggedIn}
                  placeholder={
                    isLoggedIn
                      ? replyTarget
                        ? `Balas ${replyTarget.user}...`
                        : "Bergabung dengan percakapan... pakai @"
                      : "Login untuk menambahkan komentar"
                  }
                  className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 caret-blue-600 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={
                    !isLoggedIn || !commentText.trim() || submittingComment
                  }
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submittingComment ? (
                    <FiLoader className="h-5 w-5 animate-spin" />
                  ) : (
                    <FiSend className="h-5 w-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {shareOpen && (
        <div className="fixed inset-0 z-[1010] flex items-end justify-center bg-slate-950/35">
          <div className="w-full max-w-full rounded-t-[2rem] bg-white p-5 pb-[max(1rem,env(safe-area-inset-bottom))] text-slate-900 shadow-2xl shadow-slate-950/20 md:max-w-[460px]">
            <button
              type="button"
              onClick={() => setShareOpen(false)}
              className="mx-auto mb-5 block h-1.5 w-14 rounded-full bg-slate-300"
            />

            <h3 className="text-center text-xl font-black">Bagikan</h3>

            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <button type="button" onClick={handleShare} className="space-y-2">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <FiCopy className="h-7 w-7" />
                </span>
                <span className="block text-sm font-bold">Salin tautan</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(fullPostUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="space-y-2"
              >
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-500 text-white">
                  <FiShare2 className="h-7 w-7" />
                </span>
                <span className="block text-sm font-bold">WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="space-y-2"
              >
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-700">
                  <FiX className="h-7 w-7" />
                </span>
                <span className="block text-sm font-bold">Tutup</span>
              </button>
            </div>

            {shareStatus && (
              <p className="mt-5 text-center text-sm font-bold text-blue-600">
                {shareStatus}
              </p>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes heartBurst {
          0% {
            opacity: 0;
            transform: scale(0.2);
          }

          25% {
            opacity: 1;
            transform: scale(1.15);
          }

          100% {
            opacity: 0;
            transform: scale(1.8);
          }
        }

        .heart-burst {
          animation: heartBurst 650ms ease-out both;
        }

        .gallery-hidden-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .gallery-hidden-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>,
    document.body,
  );
}
