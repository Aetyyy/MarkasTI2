"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/libs/prisma";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { broadcastGalleryRealtime } from "@/libs/gallery/realtime";
import { formatGalleryTime } from "@/libs/gallery/time";
import { isVercelBlobUrl } from "@/libs/vercelBlob";
import {
  GALLERY_CATEGORY_OPTIONS,
  type GalleryActionResult,
  type GalleryCommentForClient,
  type GalleryCommentsPage,
} from "@/types/gallery";
import { deleteUploadFileByUrl } from "@/libs/gallery/storage";
import { broadcastToInterestedUsers } from "@/libs/notifications/broadcastToUsers";

const GALLERY_PATH = "/gallery";
const MAX_FILES = 10;

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

function containsSelfMention(text: string, name?: string | null) {
  const cleanName = name?.trim();
  if (!cleanName || !text) return false;

  const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`@${escapedName}(?=$|[\\s.,!?;:])`, "iu").test(text);
}

function isValidCategory(category: string) {
  return GALLERY_CATEGORY_OPTIONS.includes(
    category as (typeof GALLERY_CATEGORY_OPTIONS)[number],
  );
}

function readImageMetadata(formData: FormData) {
  const raw = getFormString(formData, "imageMetadata");
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => {
      const value = item as Record<string, unknown>;
      const dimension = (key: "width" | "height") => {
        const number = Number(value[key]);
        return Number.isFinite(number)
          ? Math.max(1, Math.min(20_000, Math.trunc(number)))
          : null;
      };
      const size = Number(value.sizeBytes);

      return {
        width: dimension("width"),
        height: dimension("height"),
        sizeBytes: Number.isFinite(size)
          ? Math.max(1, Math.min(8 * 1024 * 1024, Math.trunc(size)))
          : null,
      };
    });
  } catch {
    return [];
  }
}

async function tryDeleteFile(url: string) {
  await deleteUploadFileByUrl(url);
}

function mapComment(
  comment: {
    id: string;
    parentId: string | null;
    userId: string;
    text: string;
    likesCount: number;
    repliesCount: number;
    createdAt: Date;
    user: {
      name: string;
      nim: string;
    };
    likes?: {
      id: string;
    }[];
  },
  currentUserId?: string,
  canDeleteByPermission = false,
): GalleryCommentForClient {
  const name = comment.user.name || comment.user.nim || "User";
  const isOwner = Boolean(currentUserId && comment.userId === currentUserId);

  return {
    id: comment.id,
    parentId: comment.parentId,
    userId: comment.userId,
    user: name,
    avatarText: getInitials(name),
    text: comment.text,
    createdAt: formatGalleryTime(comment.createdAt),
    likesCount: comment.likesCount,
    repliesCount: comment.repliesCount,
    likedByMe: Boolean(comment.likes?.length),
    canEdit: isOwner,
    canDelete: isOwner || canDeleteByPermission,
  };
}

export async function createGalleryPostAction(
  formData: FormData,
): Promise<GalleryActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Kamu harus login untuk upload foto.",
      };
    }

    const title = getFormString(formData, "title");
    const category = getFormString(formData, "category");
    const description = getFormString(formData, "description");
    const imageUrls = formData
      .getAll("imageUrls")
      .map((value) => String(value));
    const thumbnailUrls = formData
      .getAll("thumbnailUrls")
      .map((value) => String(value));
    const imageMetadata = readImageMetadata(formData);

    if (containsSelfMention(description, session.user.name)) {
      return {
        success: false,
        message: "Kamu tidak bisa tag akun sendiri.",
      };
    }

    if (!title) {
      return {
        success: false,
        message: "Judul foto wajib diisi.",
      };
    }

    if (!isValidCategory(category)) {
      return {
        success: false,
        message: "Kategori tidak valid.",
      };
    }

    if (imageUrls.length === 0) {
      return {
        success: false,
        message: "Minimal upload 1 foto ke Vercel Blob.",
      };
    }

    if (imageUrls.length > MAX_FILES) {
      return {
        success: false,
        message: "Maksimal upload 10 foto dalam 1 post.",
      };
    }

    if (
      thumbnailUrls.length !== imageUrls.length ||
      imageMetadata.length !== imageUrls.length ||
      imageUrls.some((url) => !isVercelBlobUrl(url, "gallery")) ||
      thumbnailUrls.some((url) => !isVercelBlobUrl(url, "gallery"))
    ) {
      return {
        success: false,
        message: "URL foto tidak valid atau belum selesai diupload.",
      };
    }

    const optimizedImages = imageUrls.map((url, index) => ({
      url,
      thumbnailUrl: thumbnailUrls[index]!,
      width: imageMetadata[index]!.width,
      height: imageMetadata[index]!.height,
      sizeBytes: imageMetadata[index]!.sizeBytes,
      sortOrder: index,
    }));

    const createdPost = await prisma.galleryPost.create({
      data: {
        title,
        category,
        description: description || null,
        uploadedById: session.user.id,
        images: {
          create: optimizedImages,
        },
      },
    });

    revalidatePath(GALLERY_PATH);

    broadcastGalleryRealtime({
      type: "GALLERY_REFRESH",
    });

    await broadcastToInterestedUsers(
      "notifyGalleryUploads",
      {
        type: "gallery",
        title: "Foto baru di gallery",
        body: `${session.user.name || "Seseorang"} mengunggah “${title}”.`,
        url: "/gallery",
        tag: `gallery-${createdPost.id}`,
        referenceId: createdPost.id,
      },
      session.user.id,
    ).catch((error) => console.error("Gallery notification dispatch failed", error));

    return {
      success: true,
      message: "Foto berhasil diupload.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal upload foto.",
    };
  }
}

export async function updateGalleryPostAction(
  postId: string,
  formData: FormData,
): Promise<GalleryActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Kamu harus login.",
      };
    }

    const post = await prisma.galleryPost.findUnique({
      where: {
        id: postId,
      },
      select: {
        uploadedById: true,
      },
    });

    if (!post) {
      return {
        success: false,
        message: "Postingan tidak ditemukan.",
      };
    }

    if (post.uploadedById !== session.user.id) {
      return {
        success: false,
        message: "Kamu hanya bisa edit postingan milik sendiri.",
      };
    }

    const title = getFormString(formData, "title");
    const description = getFormString(formData, "description");
    const category = getFormString(formData, "category");

    if (containsSelfMention(description, session.user.name)) {
      return {
        success: false,
        message: "Kamu tidak bisa tag akun sendiri.",
      };
    }

    if (!title) {
      return {
        success: false,
        message: "Judul wajib diisi.",
      };
    }

    if (!isValidCategory(category)) {
      return {
        success: false,
        message: "Kategori tidak valid.",
      };
    }

    await prisma.galleryPost.update({
      where: {
        id: postId,
      },
      data: {
        title,
        description: description || null,
        category,
      },
    });

    revalidatePath(GALLERY_PATH);

    broadcastGalleryRealtime({
      type: "POST_UPDATED",
      postId,
      title,
      description: description || null,
      category,
    });

    return {
      success: true,
      message: "Postingan berhasil diperbarui.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal update postingan.",
    };
  }
}

export async function deleteGalleryPostAction(
  postId: string,
): Promise<GalleryActionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Kamu harus login.",
      };
    }

    const post = await prisma.galleryPost.findUnique({
      where: {
        id: postId,
      },
      include: {
        images: true,
      },
    });

    if (!post) {
      return {
        success: false,
        message: "Postingan tidak ditemukan.",
      };
    }

    const allowed =
      post.uploadedById === session.user.id ||
      canAccess(session.user, PERMISSION_SCOPES.gallery, "delete");

    if (!allowed) {
      return {
        success: false,
        message: "Kamu tidak punya izin menghapus postingan ini.",
      };
    }

    await prisma.galleryPost.delete({
      where: {
        id: postId,
      },
    });

    await Promise.all(
      post.images.flatMap((image) => [
        tryDeleteFile(image.url),
        tryDeleteFile(image.thumbnailUrl),
      ]),
    );

    revalidatePath(GALLERY_PATH);

    broadcastGalleryRealtime({
      type: "POST_DELETED",
      postId,
    });

    return {
      success: true,
      message: "Postingan berhasil dihapus.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal menghapus postingan.",
    };
  }
}

export async function togglePinGalleryPostAction(
  postId: string,
): Promise<GalleryActionResult<{ isPinned: boolean }>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Kamu harus login.",
      };
    }

    if (!canAccess(session.user, PERMISSION_SCOPES.gallery, "update")) {
      return {
        success: false,
        message: "Kamu tidak punya izin pin postingan.",
      };
    }

    const post = await prisma.galleryPost.findUnique({
      where: {
        id: postId,
      },
      select: {
        isPinned: true,
      },
    });

    if (!post) {
      return {
        success: false,
        message: "Postingan tidak ditemukan.",
      };
    }

    const nextPinned = !post.isPinned;

    await prisma.galleryPost.update({
      where: {
        id: postId,
      },
      data: {
        isPinned: nextPinned,
        pinnedAt: nextPinned ? new Date() : null,
      },
    });

    revalidatePath(GALLERY_PATH);

    broadcastGalleryRealtime({
      type: "POST_PINNED",
      postId,
      isPinned: nextPinned,
    });

    return {
      success: true,
      message: nextPinned
        ? "Postingan berhasil dipin."
        : "Pin postingan dilepas.",
      data: {
        isPinned: nextPinned,
      },
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal mengubah pin postingan.",
    };
  }
}

export async function toggleGalleryLikeAction(
  postId: string,
): Promise<GalleryActionResult<{ liked: boolean; likesCount: number }>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Kamu harus login untuk like foto.",
      };
    }

    const existingLike = await prisma.galleryLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      const result = await prisma.$transaction(async (tx) => {
        await tx.galleryLike.delete({
          where: {
            id: existingLike.id,
          },
        });

        return tx.galleryPost.update({
          where: {
            id: postId,
          },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
          select: {
            likesCount: true,
          },
        });
      });

      revalidatePath(GALLERY_PATH);

      broadcastGalleryRealtime({
        type: "POST_LIKED",
        postId,
        likesCount: Math.max(0, result.likesCount),
      });

      return {
        success: true,
        message: "Like dihapus.",
        data: {
          liked: false,
          likesCount: Math.max(0, result.likesCount),
        },
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.galleryLike.create({
        data: {
          postId,
          userId: session.user.id,
        },
      });

      return tx.galleryPost.update({
        where: {
          id: postId,
        },
        data: {
          likesCount: {
            increment: 1,
          },
        },
        select: {
          likesCount: true,
        },
      });
    });

    revalidatePath(GALLERY_PATH);

    broadcastGalleryRealtime({
      type: "POST_LIKED",
      postId,
      likesCount: result.likesCount,
    });

    return {
      success: true,
      message: "Foto disukai.",
      data: {
        liked: true,
        likesCount: result.likesCount,
      },
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal mengubah like.",
    };
  }
}

export async function createGalleryCommentAction(
  postId: string,
  text: string,
  parentId?: string | null,
): Promise<GalleryActionResult<GalleryCommentForClient>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Kamu harus login untuk komentar.",
      };
    }

    const cleanText = text.trim();

    if (containsSelfMention(cleanText, session.user.name)) {
      return {
        success: false,
        message: "Kamu tidak bisa tag akun sendiri.",
      };
    }

    if (!cleanText) {
      return {
        success: false,
        message: "Komentar tidak boleh kosong.",
      };
    }

    if (cleanText.length > 500) {
      return {
        success: false,
        message: "Komentar maksimal 500 karakter.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const comment = await tx.galleryComment.create({
        data: {
          postId,
          userId: session.user.id,
          parentId: parentId || null,
          text: cleanText,
        },
        include: {
          user: {
            select: {
              name: true,
              nim: true,
            },
          },
          likes: {
            where: {
              userId: session.user.id,
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      });

      const updatedPost = await tx.galleryPost.update({
        where: {
          id: postId,
        },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
        select: {
          commentsCount: true,
        },
      });

      if (parentId) {
        await tx.galleryComment.update({
          where: {
            id: parentId,
          },
          data: {
            repliesCount: {
              increment: 1,
            },
          },
        });
      }

      return {
        comment,
        commentsCount: updatedPost.commentsCount,
      };
    });

    const commentData = mapComment(result.comment, session.user.id, true);

    revalidatePath(GALLERY_PATH);

    if (parentId) {
      broadcastGalleryRealtime({
        type: "COMMENT_REPLIED",
        postId,
        parentId,
        reply: {
          ...commentData,
          canEdit: false,
          canDelete: false,
        },
        commentsCount: result.commentsCount,
      });
    } else {
      broadcastGalleryRealtime({
        type: "COMMENT_CREATED",
        postId,
        comment: {
          ...commentData,
          canEdit: false,
          canDelete: false,
        },
        commentsCount: result.commentsCount,
      });
    }

    return {
      success: true,
      message: parentId
        ? "Balasan berhasil ditambahkan."
        : "Komentar berhasil ditambahkan.",
      data: commentData,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal menambahkan komentar.",
    };
  }
}

export async function updateGalleryCommentAction(
  commentId: string,
  text: string,
): Promise<GalleryActionResult<GalleryCommentForClient>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Kamu harus login.",
      };
    }

    const cleanText = text.trim();

    if (containsSelfMention(cleanText, session.user.name)) {
      return {
        success: false,
        message: "Kamu tidak bisa tag akun sendiri.",
      };
    }

    if (!cleanText) {
      return {
        success: false,
        message: "Komentar tidak boleh kosong.",
      };
    }

    if (cleanText.length > 500) {
      return {
        success: false,
        message: "Komentar maksimal 500 karakter.",
      };
    }

    const oldComment = await prisma.galleryComment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
        userId: true,
        postId: true,
      },
    });

    if (!oldComment) {
      return {
        success: false,
        message: "Komentar tidak ditemukan.",
      };
    }

    if (oldComment.userId !== session.user.id) {
      return {
        success: false,
        message: "Kamu hanya bisa edit komentar milik sendiri.",
      };
    }

    const updatedComment = await prisma.galleryComment.update({
      where: {
        id: commentId,
      },
      data: {
        text: cleanText,
      },
      include: {
        user: {
          select: {
            name: true,
            nim: true,
          },
        },
        likes: {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    const commentData = mapComment(updatedComment, session.user.id, true);

    revalidatePath(GALLERY_PATH);

    broadcastGalleryRealtime({
      type: "COMMENT_UPDATED",
      postId: oldComment.postId,
      commentId,
      text: cleanText,
    });

    return {
      success: true,
      message: "Komentar berhasil diedit.",
      data: commentData,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal mengedit komentar.",
    };
  }
}

export async function deleteGalleryCommentAction(commentId: string): Promise<
  GalleryActionResult<{
    commentId: string;
    parentId: string | null;
    postId: string;
    commentsCount: number;
    deletedCount: number;
  }>
> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Kamu harus login.",
      };
    }

    const comment = await prisma.galleryComment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
        postId: true,
        parentId: true,
        userId: true,
      },
    });

    if (!comment) {
      return {
        success: false,
        message: "Komentar tidak ditemukan.",
      };
    }

    const canDeleteByPermission = canAccess(
      session.user,
      PERMISSION_SCOPES.gallery,
      "delete",
    );

    const allowed = comment.userId === session.user.id || canDeleteByPermission;

    if (!allowed) {
      return {
        success: false,
        message: "Kamu tidak punya izin menghapus komentar ini.",
      };
    }

    const replyCount = comment.parentId
      ? 0
      : await prisma.galleryComment.count({
          where: {
            parentId: comment.id,
          },
        });

    const deletedCount = replyCount + 1;

    const result = await prisma.$transaction(async (tx) => {
      await tx.galleryComment.delete({
        where: {
          id: comment.id,
        },
      });

      if (comment.parentId) {
        await tx.galleryComment.update({
          where: {
            id: comment.parentId,
          },
          data: {
            repliesCount: {
              decrement: 1,
            },
          },
        });
      }

      return tx.galleryPost.update({
        where: {
          id: comment.postId,
        },
        data: {
          commentsCount: {
            decrement: deletedCount,
          },
        },
        select: {
          commentsCount: true,
        },
      });
    });

    const safeCommentsCount = Math.max(0, result.commentsCount);

    revalidatePath(GALLERY_PATH);

    broadcastGalleryRealtime({
      type: "COMMENT_DELETED",
      postId: comment.postId,
      commentId: comment.id,
      parentId: comment.parentId,
      commentsCount: safeCommentsCount,
      deletedCount,
    });

    broadcastGalleryRealtime({
      type: "GALLERY_REFRESH",
    });

    return {
      success: true,
      message: "Komentar berhasil dihapus.",
      data: {
        commentId: comment.id,
        parentId: comment.parentId,
        postId: comment.postId,
        commentsCount: safeCommentsCount,
        deletedCount,
      },
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal menghapus komentar.",
    };
  }
}

export async function getGalleryCommentsAction(
  postId: string,
  cursor?: string | null,
): Promise<GalleryActionResult<GalleryCommentsPage>> {
  try {
    const session = await auth();
    const userId = session?.user?.id || "";

    const canDeleteByPermission = canAccess(
      session?.user,
      PERMISSION_SCOPES.gallery,
      "delete",
    );

    const comments = await prisma.galleryComment.findMany({
      where: {
        postId,
        parentId: null,
      },
      take: 10,
      ...(cursor
        ? {
            skip: 1,
            cursor: {
              id: cursor,
            },
          }
        : {}),
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            nim: true,
          },
        },
        likes: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    return {
      success: true,
      message: "Komentar berhasil dimuat.",
      data: {
        comments: comments.map((comment) =>
          mapComment(comment, userId, canDeleteByPermission),
        ),
        nextCursor:
          comments.length === 10
            ? comments[comments.length - 1]?.id || null
            : null,
      },
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal memuat komentar.",
    };
  }
}

export async function getGalleryRepliesAction(
  parentId: string,
  cursor?: string | null,
): Promise<GalleryActionResult<GalleryCommentsPage>> {
  try {
    const session = await auth();
    const userId = session?.user?.id || "";

    const canDeleteByPermission = canAccess(
      session?.user,
      PERMISSION_SCOPES.gallery,
      "delete",
    );

    const replies = await prisma.galleryComment.findMany({
      where: {
        parentId,
      },
      take: 8,
      ...(cursor
        ? {
            skip: 1,
            cursor: {
              id: cursor,
            },
          }
        : {}),
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            name: true,
            nim: true,
          },
        },
        likes: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    return {
      success: true,
      message: "Balasan berhasil dimuat.",
      data: {
        comments: replies.map((reply) =>
          mapComment(reply, userId, canDeleteByPermission),
        ),
        nextCursor:
          replies.length === 8 ? replies[replies.length - 1]?.id || null : null,
      },
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal memuat balasan.",
    };
  }
}

export async function toggleGalleryCommentLikeAction(
  commentId: string,
): Promise<GalleryActionResult<{ liked: boolean; likesCount: number }>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Kamu harus login untuk like komentar.",
      };
    }

    const existingLike = await prisma.galleryCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      const result = await prisma.$transaction(async (tx) => {
        await tx.galleryCommentLike.delete({
          where: {
            id: existingLike.id,
          },
        });

        return tx.galleryComment.update({
          where: {
            id: commentId,
          },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
          select: {
            likesCount: true,
          },
        });
      });

      broadcastGalleryRealtime({
        type: "COMMENT_LIKED",
        commentId,
        likesCount: Math.max(0, result.likesCount),
      });

      return {
        success: true,
        message: "Like komentar dihapus.",
        data: {
          liked: false,
          likesCount: Math.max(0, result.likesCount),
        },
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.galleryCommentLike.create({
        data: {
          commentId,
          userId: session.user.id,
        },
      });

      return tx.galleryComment.update({
        where: {
          id: commentId,
        },
        data: {
          likesCount: {
            increment: 1,
          },
        },
        select: {
          likesCount: true,
        },
      });
    });

    broadcastGalleryRealtime({
      type: "COMMENT_LIKED",
      commentId,
      likesCount: result.likesCount,
    });

    return {
      success: true,
      message: "Komentar disukai.",
      data: {
        liked: true,
        likesCount: result.likesCount,
      },
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal like komentar.",
    };
  }
}

export async function shareGalleryPostAction(
  postId: string,
): Promise<GalleryActionResult<{ sharesCount: number }>> {
  try {
    const session = await auth();

    const result = await prisma.$transaction(async (tx) => {
      await tx.galleryShare.create({
        data: {
          postId,
          userId: session?.user?.id || null,
        },
      });

      return tx.galleryPost.update({
        where: {
          id: postId,
        },
        data: {
          sharesCount: {
            increment: 1,
          },
        },
        select: {
          sharesCount: true,
        },
      });
    });

    revalidatePath(GALLERY_PATH);

    broadcastGalleryRealtime({
      type: "POST_SHARED",
      postId,
      sharesCount: result.sharesCount,
    });

    return {
      success: true,
      message: "Share berhasil dicatat.",
      data: {
        sharesCount: result.sharesCount,
      },
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal share foto.",
    };
  }
}
