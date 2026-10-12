import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/libs/prisma";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";
import { formatGalleryTime } from "@/libs/gallery/time";
import type { GalleryMentionUser, GalleryPostForClient } from "@/types/gallery";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

export async function getGalleryMentionUsers(): Promise<GalleryMentionUser[]> {
  const session = await auth();
  const users = await prisma.user.findMany({
    where: session?.user?.id
      ? {
          id: {
            not: session.user.id,
          },
        }
      : undefined,
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      nim: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    nim: user.nim,
    avatarText: getInitials(user.name || user.nim || "User"),
  }));
}

export async function getGalleryPosts(): Promise<GalleryPostForClient[]> {
  const session = await auth();
  const userId = session?.user?.id;

  const canDeleteByPermission = canAccess(
    session?.user,
    PERMISSION_SCOPES.gallery,
    "delete",
  );

  const canPinByPermission = canAccess(
    session?.user,
    PERMISSION_SCOPES.gallery,
    "update",
  );

  const posts = await prisma.galleryPost.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      {
        isPinned: "desc",
      },
      {
        pinnedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      uploadedBy: {
        select: {
          name: true,
          email: true,
          nim: true,
          roles: {
            take: 1,
            select: {
              name: true,
            },
          },
        },
      },
      comments: {
        where: {
          parentId: null,
        },
        take: 3,
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
              userId: userId || "",
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  const postIds = posts.map((post) => post.id);

  const likedPosts = userId
    ? await prisma.galleryLike.findMany({
        where: {
          userId,
          postId: {
            in: postIds,
          },
        },
        select: {
          postId: true,
        },
      })
    : [];

  const likedPostIds = new Set(likedPosts.map((like) => like.postId));

  return posts.map((post) => {
    const uploaderName =
      post.uploadedBy.name || post.uploadedBy.email || "User";

    const isOwner = Boolean(userId && post.uploadedById === userId);

    return {
      id: post.id,
      title: post.title,
      description: post.description,
      category: post.category,
      uploadedById: post.uploadedById,
      uploadedBy: uploaderName,
      uploadedByRole: post.uploadedBy.roles[0]?.name || "Member TI2",
      uploadedByAvatarText: getInitials(uploaderName),
      uploadedAt: formatGalleryTime(post.createdAt),
      images: post.images.map((image) => ({
        id: image.id,
        url: image.url,
        thumbnailUrl: image.thumbnailUrl,
        width: image.width,
        height: image.height,
        sortOrder: image.sortOrder,
      })),
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      likedByMe: likedPostIds.has(post.id),
      isPinned: post.isPinned,
      canEdit: isOwner,
      canDelete: isOwner || canDeleteByPermission,
      canPin: canPinByPermission,
      commentsPreview: post.comments.map((comment) => {
        const commentUser = comment.user.name || comment.user.nim || "User";
        const isCommentOwner = Boolean(userId && comment.userId === userId);

        return {
          id: comment.id,
          parentId: comment.parentId,
          userId: comment.userId,
          user: commentUser,
          avatarText: getInitials(commentUser),
          text: comment.text,
          createdAt: formatGalleryTime(comment.createdAt),
          likesCount: comment.likesCount,
          repliesCount: comment.repliesCount,
          likedByMe: comment.likes.length > 0,
          canEdit: isCommentOwner,
          canDelete: isCommentOwner || canDeleteByPermission,
        };
      }),
    };
  });
}
