"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  title: z.string().min(4),
  city: z.string().min(2),
  price: z.number().positive(),
  description: z.string().min(20),
  status: z.enum(["draft", "published"]),
});

type Values = z.infer<typeof schema>;

export default function NewPropertyPage() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "draft",
      title: "",
      city: "",
      price: 1_000_000,
      description: "",
    },
  });

  const status = useWatch({ control: form.control, name: "status" });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add property</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Multi-step upload for gallery, video, and compliance docs — condensed for the scaffold.
        </p>
      </div>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Core details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(() => toast.success("Draft saved (demo)"))}
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register("title")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...form.register("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input id="price" type="number" {...form.register("price", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status ?? "draft"}
                onValueChange={(v) => form.setValue("status", v as Values["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register("description")} />
            </div>
            <Button type="submit" className="rounded-full">
              Save draft
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
