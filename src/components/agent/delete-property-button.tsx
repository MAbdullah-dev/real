"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deletePropertyAction } from "@/server/actions/properties";

export function DeletePropertyButton({
  id,
  title,
}: {
  id: string;
  title?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deletePropertyAction(id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Listing deleted");
      setOpen(false);
      router.push("/agency/properties");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="rounded-full" disabled={pending}>
          <Trash2 className="mr-2 h-4 w-4" aria-hidden />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this listing?</DialogTitle>
          <DialogDescription>
            {title
              ? `"${title}" will be permanently removed from your portfolio and the public site.`
              : "This listing will be permanently removed from your portfolio and the public site."}{" "}
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Keep listing
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={pending}
            onClick={confirmDelete}
          >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            {pending ? "Deleting…" : "Delete listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
