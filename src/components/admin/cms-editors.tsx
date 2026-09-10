"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteBlogPostAction,
  deleteFaqAction,
  saveBlogPostAction,
  saveFaqAction,
} from "@/server/actions/admin";

export type PostDraft = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  published: boolean;
};

export type FaqDraft = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  published: boolean;
};

const blankPost: PostDraft = {
  id: "",
  title: "",
  excerpt: "",
  body: "",
  published: false,
};

const blankFaq: FaqDraft = {
  id: "",
  question: "",
  answer: "",
  sortOrder: 0,
  published: true,
};

export function BlogEditor({ posts }: { posts: PostDraft[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [draft, setDraft] = React.useState<PostDraft>(blankPost);

  function save() {
    startTransition(async () => {
      const result = await saveBlogPostAction({
        id: draft.id || undefined,
        title: draft.title,
        excerpt: draft.excerpt,
        body: draft.body,
        published: draft.published,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(draft.id ? "Post updated" : "Post created");
      setDraft(blankPost);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <Card className="rounded-3xl">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium">{draft.id ? "Edit post" : "New post"}</p>
            {draft.id ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => setDraft(blankPost)}
              >
                Cancel
              </Button>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-excerpt">Excerpt</Label>
            <Input
              id="post-excerpt"
              value={draft.excerpt}
              onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-body">Body</Label>
            <Textarea
              id="post-body"
              rows={10}
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border p-4">
            <div>
              <p className="text-sm font-medium">Published</p>
              <p className="text-sm text-muted-foreground">Visible on the public blog.</p>
            </div>
            <Switch
              checked={draft.published}
              onCheckedChange={(next) => setDraft({ ...draft, published: next })}
            />
          </div>
          <Button type="button" className="rounded-full" onClick={save} disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {draft.id ? "Save post" : "Create post"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="rounded-2xl">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{post.title}</p>
                  <Badge variant={post.published ? "default" : "secondary"}>
                    {post.published ? "Live" : "Draft"}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{post.excerpt}</p>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setDraft(post)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteBlogPostAction(post.id);
                        toast.success("Post deleted");
                        if (draft.id === post.id) setDraft(blankPost);
                        router.refresh();
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export function FaqEditor({ faqs }: { faqs: FaqDraft[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [draft, setDraft] = React.useState<FaqDraft>(blankFaq);

  function save() {
    startTransition(async () => {
      const result = await saveFaqAction({
        id: draft.id || undefined,
        question: draft.question,
        answer: draft.answer,
        sortOrder: draft.sortOrder,
        published: draft.published,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(draft.id ? "FAQ updated" : "FAQ created");
      setDraft(blankFaq);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <Card className="rounded-3xl">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium">{draft.id ? "Edit FAQ" : "New FAQ"}</p>
            {draft.id ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => setDraft(blankFaq)}
              >
                Cancel
              </Button>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-question">Question</Label>
            <Input
              id="faq-question"
              value={draft.question}
              onChange={(event) => setDraft({ ...draft, question: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-answer">Answer</Label>
            <Textarea
              id="faq-answer"
              rows={6}
              value={draft.answer}
              onChange={(event) => setDraft({ ...draft, answer: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-order">Sort order</Label>
            <Input
              id="faq-order"
              type="number"
              value={draft.sortOrder}
              onChange={(event) =>
                setDraft({ ...draft, sortOrder: Number(event.target.value) || 0 })
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border p-4">
            <p className="text-sm font-medium">Published</p>
            <Switch
              checked={draft.published}
              onCheckedChange={(next) => setDraft({ ...draft, published: next })}
            />
          </div>
          <Button type="button" className="rounded-full" onClick={save} disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {draft.id ? "Save FAQ" : "Create FAQ"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {faqs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No FAQ entries yet.</p>
        ) : (
          faqs.map((faq) => (
            <Card key={faq.id} className="rounded-2xl">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{faq.question}</p>
                  <Badge variant={faq.published ? "default" : "secondary"}>
                    {faq.published ? "Live" : "Hidden"}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setDraft(faq)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteFaqAction(faq.id);
                        toast.success("FAQ deleted");
                        if (draft.id === faq.id) setDraft(blankFaq);
                        router.refresh();
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
