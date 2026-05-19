import { notFound } from "next/navigation"
import { getPostBySlug } from "@/lib/posts"
import { PostForm } from "../../PostForm"

export const dynamic = "force-dynamic"

export default async function EditPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()

  return (
    <PostForm
      mode="edit"
      originalSlug={post.slug}
      initial={{
        slug: post.slug,
        title: post.title,
        date: post.date.split("T")[0],
        category: post.category,
        tags: post.tags.join(", "),
        excerpt: post.excerpt,
        thumbnail: post.thumbnail || "",
        published: post.published,
        content: post.content,
      }}
    />
  )
}
