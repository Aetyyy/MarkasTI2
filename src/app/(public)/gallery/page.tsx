import GalleryClient from "@/components/gallery/galleryClient";
import { getGalleryMentionUsers, getGalleryPosts } from "@/libs/gallery/query";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const [posts, mentionUsers] = await Promise.all([
    getGalleryPosts(),
    getGalleryMentionUsers(),
  ]);

  return (
    <main className="app-page-canvas min-h-screen overflow-hidden pt-20 md:pt-28">
      <GalleryClient initialPosts={posts} mentionUsers={mentionUsers} />
    </main>
  );
}
