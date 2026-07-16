"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "No se pudo iniciar sesión");
        return;
      }

      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-sm space-y-5 border border-[var(--line)] bg-[var(--mist)] px-5 py-8"
    >
      <header className="space-y-1">
        <p className="font-display text-sm tracking-[0.2em] text-[var(--silver)]">
          SIGMABARBER
        </p>
        <h1 className="font-display text-2xl font-bold tracking-wide text-[var(--silver-light)]">
          Panel del dueño
        </h1>
        <p className="text-sm text-[var(--steel)]">
          Acceso con la contraseña de administración.
        </p>
      </header>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="bg-[var(--ink)]"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending || !password}
        className="w-full min-h-11 bg-[var(--silver-light)] text-[var(--ink)] hover:bg-[var(--silver)]"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Entrando…
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
}
