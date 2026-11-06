"use client";

import { useState } from "react";

type SavedFile = { id: string; filename: string };

export function FileTray({ draftId }: { draftId: string }) {
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onPick(list: FileList | null) {
    if (!list || list.length === 0 || !draftId) return;
    setPending(true);
    setError("");
    const next = [...files];
    for (const file of Array.from(list)) {
      const body = new FormData();
      body.set("draftId", draftId);
      body.set("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const data = (await response.json().catch(() => null)) as { id?: string; filename?: string; error?: string } | null;
      if (!response.ok || !data?.id || !data.filename) {
        setError(data?.error || "That file didn't save.");
        break;
      }
      next.push({ id: data.id, filename: data.filename });
    }
    setFiles(next);
    setPending(false);
  }

  if (!draftId) return null;

  return (
    <div className="mb-3 border border-border bg-card px-3 py-3">
      <label className="block text-sm" htmlFor="desk-files">
        Attach the papers
        <input
          id="desk-files"
          className="mt-2 block w-full text-sm file:mr-3 file:border file:border-border file:bg-background file:px-3 file:py-2"
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,application/pdf,image/*"
          disabled={pending}
          onChange={(event) => {
            void onPick(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {pending && <p className="mt-2 text-sm text-muted-foreground">Saving the file…</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {files.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">
          {files.map((file) => (
            <li key={file.id}>{file.filename}</li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-muted-foreground">PDF, Word, text, or a photo. Five files, 8 MB each.</p>
    </div>
  );
}
