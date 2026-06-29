"use client";

import { useState } from "react";

export default function AcceptInviteForm({
  token,
  email,
  role,
}: {
  token: string;
  email: string;
  role: string;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function acceptInvite() {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "/api/invite/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            name,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Failed to accept invite"
        );
      }

      window.location.href = "/login";
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-20 max-w-md rounded-lg border bg-card p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">
        Accept Invitation
      </h1>

      <p className="mb-1 text-sm text-muted-foreground">
        Email
      </p>

      <p className="mb-4 font-medium">
        {email}
      </p>

      <p className="mb-1 text-sm text-muted-foreground">
        Role
      </p>

      <p className="mb-4 font-medium">
        {role}
      </p>

      <input
        className="mb-4 w-full rounded-md border p-2"
        placeholder="Your name"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />

      <button
        onClick={acceptInvite}
        disabled={loading}
        className="w-full rounded-md bg-black p-2 text-white disabled:opacity-50"
      >
        {loading
          ? "Joining Workspace..."
          : "Accept Invitation"}
      </button>
    </div>
  );
}