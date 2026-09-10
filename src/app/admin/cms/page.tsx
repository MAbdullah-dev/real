import { Suspense } from "react";

import { BlogEditor, FaqEditor } from "@/components/admin/cms-editors";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listAllBlogPosts, listAllFaqs } from "@/server/admin";

async function CmsContent() {
  const [posts, faqs] = await Promise.all([listAllBlogPosts(), listAllFaqs()]);

  return (
    <Tabs defaultValue="blog">
      <TabsList>
        <TabsTrigger value="blog">Blog ({posts.length})</TabsTrigger>
        <TabsTrigger value="faq">FAQ ({faqs.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="blog" className="mt-6">
        <BlogEditor
          posts={posts.map((post) => ({
            id: post.id,
            title: post.title,
            excerpt: post.excerpt,
            body: post.body,
            published: post.publishedAt != null,
          }))}
        />
      </TabsContent>
      <TabsContent value="faq" className="mt-6">
        <FaqEditor
          faqs={faqs.map((faq) => ({
            id: faq.id,
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder,
            published: faq.published,
          }))}
        />
      </TabsContent>
    </Tabs>
  );
}

export default function AdminCmsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CMS</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Blog posts and FAQ entries served to the public site.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <CmsContent />
      </Suspense>
    </div>
  );
}
