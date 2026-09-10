import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function listPublishedFaqs() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return prisma.faqItem.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listPublishedPosts() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return prisma.blogPost.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
  });
}

/** Slugs of every live post, for `generateStaticParams`. */
export async function listPublishedPostSlugs() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return prisma.blogPost.findMany({
    where: { publishedAt: { not: null } },
    select: { slug: true },
  });
}

export async function getPostBySlug(slug: string) {
  "use cache";
  cacheTag("content", `post-${slug}`);
  cacheLife("hours");

  return prisma.blogPost.findFirst({
    where: { slug, publishedAt: { not: null } },
  });
}
