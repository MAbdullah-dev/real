import type { Metadata } from "next";
import { notFound } from "next/navigation";

const posts: Record<string, { title: string; body: string }> = {
  "luxury-visit-design": {
    title: "Designing luxury visits like hospitality",
    body: "The best property platforms borrow operational rigor from hospitality: predictable arrivals, host continuity, and surprise removal. Visits should feel inevitable, not improvised.",
  },
  "media-standards": {
    title: "Media standards that actually convert",
    body: "Buyers decide in seconds — lead with honest light, show volume through sequence, and never hide awkward corners. Authenticity signals trust.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = posts[slug];
  if (!p) return {};
  return { title: p.title };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = posts[slug];
  if (!p) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold tracking-tight">{p.title}</h1>
      <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{p.body}</p>
    </article>
  );
}
