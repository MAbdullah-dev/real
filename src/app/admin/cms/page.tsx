import { Card, CardContent } from "@/components/ui/card";

export default function AdminCmsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">CMS</h1>
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-sm text-muted-foreground">
          Structured content for homepage modules, SEO landing pages, and legal documents with staged publishing.
        </CardContent>
      </Card>
    </div>
  );
}
