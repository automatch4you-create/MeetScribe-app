"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "ההתחברות נכשלה");
      }
      const from = params.get("from");
      router.replace(from && from.startsWith("/") ? from : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ההתחברות נכשלה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src="/meetscribe-logo.png"
          alt="MeetScribe"
          width={525}
          height={280}
          priority
          className="mb-2 h-20 w-auto"
        />
        <p className="text-sm text-slate-500">התחברות למערכת</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            שם משתמש
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-brand-border"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            סיסמה
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-brand-border"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "מתחבר..." : "התחברות"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
