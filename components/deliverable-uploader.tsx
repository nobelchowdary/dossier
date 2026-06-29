"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DeliverableUploader({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!file || !title.trim()) return;
    startTransition(async () => {
      const presign = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, fileName: file.name, contentType: file.type || "application/octet-stream" })
      });
      if (!presign.ok) return;
      const { uploadUrl, key, fileUrl } = await presign.json();
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file
      });
      await fetch("/api/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title,
          description,
          fileKey: key,
          fileUrl,
          fileName: file.name,
          fileSize: file.size
        })
      });
      setFile(null);
      setTitle("");
      setDescription("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Final brand guide" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should the client review?" />
      </div>
      <div className="space-y-2">
        <Label>File</Label>
        <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </div>
      <Button type="button" onClick={submit} disabled={isPending || !file || !title.trim()} className="w-full">
        <Upload className="h-4 w-4" />
        Upload deliverable
      </Button>
    </div>
  );
}
