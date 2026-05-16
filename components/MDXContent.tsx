import { MDXRemote } from "next-mdx-remote/rsc"

const components = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} target={props.href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" />
  ),
}

export function MDXContent({ source }: { source: string }) {
  return (
    <div className="prose-blog">
      {/* @ts-expect-error Async server component */}
      <MDXRemote source={source} components={components} />
    </div>
  )
}
