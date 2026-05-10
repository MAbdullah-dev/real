import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit property</h1>
          <p className="mt-2 text-sm text-muted-foreground">ID · {id}</p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/agent/properties">Back</Link>
        </Button>
      </div>
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-sm text-muted-foreground">
          Reuse the add-property form in edit mode with React Query hydration from `GET /properties/:id`.
        </CardContent>
      </Card>
    </div>
  );
}
