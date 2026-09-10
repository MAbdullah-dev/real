import { Card, CardContent } from "@/components/ui/card";
import { listPublishedPosts } from "@/server/content";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Journal",
};

export default async function BlogPage() {
  const posts = await listPublishedPosts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold tracking-tight">Journal</h1>
      <p className="mt-4 text-muted-foreground">Notes on markets, craft, and platform thinking.</p>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {posts.map((p) => (
          <Card key={p.slug} className="rounded-3xl">
            <CardContent className="p-8">
              <p className="text-xs text-muted-foreground">
                {p.publishedAt
                  ? p.publishedAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : ""}
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                <Link href={`/blog/${p.slug}`} className="hover:text-primary">
                  {p.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">{p.excerpt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
