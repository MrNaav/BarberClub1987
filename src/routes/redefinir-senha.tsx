import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { adminHead } from "@/lib/admin/metadata";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => adminHead("Redefinir senha", "Redefinição segura da senha administrativa da Barber Club 1987."),
  component: ResetPage,
});

function ResetPage() {
  const [access, setAccess] = useState<"loading" | "valid" | "invalid">("loading");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error: failure }) => {
      if (active) setAccess(!failure && data.user ? "valid" : "invalid");
    }).catch(() => { if (active) setAccess("invalid"); });
    return () => { active = false; };
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 12) { setError("Use uma senha com pelo menos 12 caracteres."); return; }
    if (password !== confirmation) { setError("As senhas precisam ser iguais."); return; }
    setBusy(true);
    try {
      const { error: failure } = await supabase.auth.updateUser({ password });
      if (failure) { setError("Não foi possível alterar a senha. Solicite um novo link ou verifique os requisitos da senha."); return; }
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      await navigate({ to: "/auth", replace: true });
    } catch { setError("Sem conexão com o servidor. Tente novamente."); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="border-b border-hairline"><div className="container-editorial flex h-[4.5rem] items-center"><Logo href="/" /></div></header>
      <main className="flex flex-1 items-center justify-center px-5 py-16"><div className="w-full max-w-sm">
        <p className="eyebrow text-bronze">Área restrita</p>
        <h1 className="mt-4 font-display text-4xl text-ivory">Redefinir senha</h1>
        {access === "loading" ? <p role="status" className="mt-6 text-sm text-stone">Verificando acesso…</p> : access === "invalid" ? (
          <><p role="alert" className="mt-6 text-sm text-stone">Link inválido ou expirado. Solicite uma nova recuperação.</p><Button asChild variant="line" size="compact" className="mt-6"><Link to="/recuperar-acesso">Recuperar acesso</Link></Button></>
        ) : (
          <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
            <label htmlFor="new-password" className="eyebrow text-stone">Nova senha</label>
            <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full border border-hairline bg-ink-soft px-4 text-ivory focus:border-bronze focus:outline-none" />
            <label htmlFor="confirm-password" className="eyebrow text-stone">Confirmar senha</label>
            <input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="h-12 w-full border border-hairline bg-ink-soft px-4 text-ivory focus:border-bronze focus:outline-none" />
            {error && <p role="alert" className="text-sm text-bronze-light">{error}</p>}
            <Button type="submit" variant="bronze" size="cta" disabled={busy}>{busy ? "Salvando…" : "Salvar senha"}</Button>
          </form>
        )}
      </div></main>
    </div>
  );
}