import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";

import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Acesso administrativo — Barber Club 1987" },
      { name: "description", content: "Entrada restrita à administração da Barber Club 1987." },
      { property: "og:title", content: "Acesso administrativo — Barber Club 1987" },
      { property: "og:description", content: "Entrada restrita à administração da Barber Club 1987." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

/** Only same-origin admin paths are accepted as a destination after sign-in. */
function safeDestination(value: string | undefined): string {
  if (!value) return "/admin";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith("/admin")) return "/admin";
    return url.pathname + url.search;
  } catch {
    return "/admin";
  }
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ href: safeDestination(redirect), replace: true });
    });
  }, [navigate, redirect]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Informe e-mail e senha.");
      return;
    }
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError(
        /invalid/i.test(signInError.message)
          ? "E-mail ou senha incorretos."
          : /fetch|network/i.test(signInError.message)
            ? "Sem conexão com o servidor. Tente novamente."
            : "Não foi possível entrar agora. Tente novamente.",
      );
      return;
    }
    navigate({ href: safeDestination(redirect), replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="border-b border-hairline">
        <div className="container-editorial flex h-[4.5rem] items-center justify-between">
          <Logo href="/" />
          <a
            href="/"
            className="link-line text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-ivory/80 hover:text-ivory"
          >
            Voltar ao site
          </a>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <p className="eyebrow text-bronze">Área restrita</p>
          <h1 className="mt-4 font-display text-[2.5rem] font-medium leading-none text-ivory">
            Acesso administrativo
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-stone">
            Entrada exclusiva da administração da barbearia.
          </p>
          <form onSubmit={submit} noValidate className="mt-10 flex flex-col gap-5">
            <div>
              <label htmlFor="admin-email" className="eyebrow mb-2 block text-[0.625rem] text-stone">
                E-mail
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-none border border-hairline bg-ink-soft px-4 text-[0.9375rem] text-ivory focus:border-bronze focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="eyebrow mb-2 block text-[0.625rem] text-stone">
                Senha
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-none border border-hairline bg-ink-soft px-4 text-[0.9375rem] text-ivory focus:border-bronze focus:outline-none"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-bronze-light">
                {error}
              </p>
            )}
            <Button type="submit" variant="bronze" size="cta" disabled={busy} className="mt-2 w-full">
              {busy ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
