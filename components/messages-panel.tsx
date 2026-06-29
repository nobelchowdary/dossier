"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import type { Attachment } from "@/lib/validators";

type Message = {
  id: string;
  body: string;
  attachments: Attachment[];
  readBy: string[];
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

export function MessagesPanel({
  projectId,
  initialMessages,
  currentUserId,
}: {
  projectId: string;
  initialMessages: Message[];
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const latest = useMemo(() => messages.at(-1)?.createdAt, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const url = latest
        ? `/api/messages/${projectId}?after=${encodeURIComponent(latest)}`
        : `/api/messages/${projectId}`;
      const response = await fetch(url);
      if (!response.ok) return;
      const fresh = (await response.json()) as Message[];
      if (fresh.length > 0) {
        setMessages((current) => [
          ...current,
          ...fresh.filter((item) => !current.some((m) => m.id === item.id)),
        ]);
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [latest, projectId]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const uploaded: Attachment[] = await Promise.all(
      files.map(async (file: File) => {
        const res = await fetch(
          `/api/uploads/presign?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
        );
        const { url, publicUrl } = await res.json();
        await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        return { url: publicUrl, name: file.name, size: file.size, type: file.type };
      })
    );
    setAttachments((prev) => [...prev, ...uploaded]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function submit() {
    if (!body.trim() && attachments.length === 0) return;
    startTransition(async () => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, body, attachments }),
      });
      if (response.ok) {
        const message = (await response.json()) as Message;
        setMessages((current) => [...current, message]);
        setBody("");
        setAttachments([]);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="space-y-4">
      <div className="max-h-96 space-y-3 overflow-auto rounded-lg border bg-muted/20 p-3">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet.
          </p>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender.id === currentUserId;
            const readCount = message.readBy.length;
            return (
              <motion.div
                key={message.id}
                className="rounded-md border bg-card p-3 shadow-sm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className={isOwn ? "font-medium text-foreground" : ""}>
                    {message.sender.name ?? message.sender.email}
                  </span>
                  <div className="flex items-center gap-2">
                    {isOwn && readCount > 1 && (
                      <span className="text-[10px] text-muted-foreground">
                        Read by {readCount - 1}
                      </span>
                    )}
                    <span>{formatDate(message.createdAt)}</span>
                  </div>
                </div>
                {message.body && (
                  <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                )}
                {message.attachments?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded border bg-muted px-2 py-1 text-xs hover:bg-muted/80"
                      >
                        <Paperclip className="h-3 w-3" />
                        {att.name}
                        <span className="text-muted-foreground">
                          ({Math.round(att.size / 1024)}kb)
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded border bg-muted px-2 py-1 text-xs"
            >
              <Paperclip className="h-3 w-3" />
              {att.name}
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message... (Ctrl+Enter to send)"
            rows={2}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={isPending}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
