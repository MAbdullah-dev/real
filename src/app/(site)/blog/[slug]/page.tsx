import { getPostBySlug, listPublishedPostSlugs } from "@/server/content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const posts = await listPublishedPostSlugs();
  return posts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPostBySlug(slug);
  if (!p) return {};
  return { title: p.title };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPostBySlug(slug);
  if (!p) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold tracking-tight">{p.title}</h1>
      <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{p.body}</p>
    </article>
  );
}
