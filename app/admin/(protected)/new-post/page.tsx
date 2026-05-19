import { PostForm } from "../PostForm"

export const dynamic = "force-dynamic"

export default function NewPostPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  return (
    <PostForm
      mode="create"
      initial={searchParams.category ? { category: searchParams.category } : undefined}
    />
  )
}
