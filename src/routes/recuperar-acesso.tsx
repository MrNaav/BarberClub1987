import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { adminHead } from "@/lib/admin/metadata";

export const Route = createFileRoute("/recuperar-acesso")({
  head: () => adminHead("Recuperação de acesso", "Solicitação segura de recuperação do acesso administrativo da Barber Club 1987."),
  component: RecoveryPage,
});

function RecoveryPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!z.string().email().max(255).safeParse(email.trim()).success) {
      setError("Informe um e-mail válido.");
      return;
    }
    setBusy(true);
    try {
      const { error: failure } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (failure) setError("Não foi possível solicitar a recuperação agora. Tente novamente mais tarde.");
      else setRequested(true);
    } catch {
      setError("Sem conexão com o servidor. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="border-b border-hairline"><div className="container-editorial flex h-[4.5rem] items-center"><Logo href="/" /></div></header>
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <p className="eyebrow text-bronze">Área restrita</p>
          <h1 className="mt-4 font-display text-4xl text-ivory">Recuperar acesso</h1>
          {requested ? (
            <p role="status" className="mt-6 text-sm leading-relaxed text-stone">Se houver uma conta associada a este e-mail, você receberá as instruções. Verifique também o spam.</p>
          ) : (
            <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
              <label htmlFor="recovery-email" className="eyebrow text-stone">E-mail</label>
              <input id="recovery-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full border border-hairline bg-ink-soft px-4 text-ivory focus:border-bronze focus:outline-none" />
              {error && <p role="alert" className="text-sm text-bronze-light">{error}</p>}
              <Button type="submit" variant="bronze" size="cta" disabled={busy}>{busy ? "Solicitando…" : "Solicitar recuperação"}</Button>
            </form>
          )}
          <Button asChild variant="link" className="mt-6 p-0 text-stone"><Link to="/auth">Voltar ao acesso</Link></Button>
        </div>
      </main>
    </div>
  );
}