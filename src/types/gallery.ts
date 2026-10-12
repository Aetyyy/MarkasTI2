export const GALLERY_CATEGORY_OPTIONS = [
  "Kegiatan Kelas",
  "Praktikum",
  "Seminar",
  "Non-Akademik",
  "Kerja Kelompok",
  "Presentasi",
  "Organisasi",
  "Lainnya",
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORY_OPTIONS)[number];

export type GalleryImageForClient = {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number | null;
  height: number | null;
  sortOrder: number;
};

export type GalleryMentionUser = {
  id: string;
  name: string;
  nim: string;
  avatarText: string;
};

export type GalleryCommentForClient = {
  id: string;
  parentId: string | null;
  userId: string;
  user: string;
  avatarText: string;
  text: string;
  createdAt: string;
  likesCount: number;
  repliesCount: number;
  likedByMe: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type GalleryPostForClient = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  uploadedById: string;
  uploadedBy: string;
  uploadedByRole: string;
  uploadedByAvatarText: string;
  uploadedAt: string;
  images: GalleryImageForClient[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedByMe: boolean;
  isPinned: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPin: boolean;
  commentsPreview: GalleryCommentForClient[];
};

export type GalleryCommentsPage = {
  comments: GalleryCommentForClient[];
  nextCursor: string | null;
};

export type GalleryActionResult<T = null> = {
  success: boolean;
  message: string;
  data?: T;
};

export type GalleryRealtimeEvent =
  | {
      type: "GALLERY_REFRESH";
    }
  | {
      type: "POST_LIKED";
      postId: string;
      likesCount: number;
    }
  | {
      type: "POST_SHARED";
      postId: string;
      sharesCount: number;
    }
  | {
      type: "COMMENT_CREATED";
      postId: string;
      comment: GalleryCommentForClient;
      commentsCount: number;
    }
  | {
      type: "COMMENT_REPLIED";
      postId: string;
      parentId: string;
      reply: GalleryCommentForClient;
      commentsCount: number;
    }
  | {
      type: "COMMENT_UPDATED";
      postId: string;
      commentId: string;
      text: string;
    }
  | {
      type: "COMMENT_DELETED";
      postId: string;
      commentId: string;
      parentId: string | null;
      commentsCount: number;
      deletedCount: number;
    }
  | {
      type: "COMMENT_LIKED";
      commentId: string;
      likesCount: number;
    }
  | {
      type: "POST_PINNED";
      postId: string;
      isPinned: boolean;
    }
  | {
      type: "POST_UPDATED";
      postId: string;
      title: string;
      description: string | null;
      category: string;
    }
  | {
      type: "POST_DELETED";
      postId: string;
    };
