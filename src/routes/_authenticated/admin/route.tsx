import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";

import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel — Barber Club 1987" },
      { name: "description", content: "Painel administrativo da Barber Club 1987." },
      { property: "og:title", content: "Painel — Barber Club 1987" },
      { property: "og:description", content: "Painel administrativo da Barber Club 1987." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.rpc("is_admin");
    return { isAdmin: !error && data === true };
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Visão geral", exact: true },
  { to: "/admin/agendamentos", label: "Agendamentos" },
  { to: "/admin/agenda", label: "Agenda do dia" },
  { to: "/admin/servicos", label: "Serviços" },
  { to: "/admin/barbeiros", label: "Barbeiros" },
  { to: "/admin/configuracoes", label: "Configurações da agenda" },
] as const;

function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

function AdminLayout() {
  const { isAdmin, user } = Route.useRouteContext();
  const signOut = useSignOut();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV.find((item) =>
    "exact" in item ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to),
  );

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-5">
        <div className="max-w-md text-center">
          <p className="eyebrow text-bronze">Acesso não autorizado</p>
          <h1 className="mt-4 font-display text-4xl text-ivory">Esta área é restrita</h1>
          <p className="mt-4 text-sm leading-relaxed text-stone">
            A conta {user.email ? <span className="text-ivory">{user.email}</span> : "atual"} não tem
            permissão de administrador.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="bronze" size="compact" onClick={signOut}>
              Sair
            </Button>
            <Button asChild variant="line" size="compact">
              <a href="/">Voltar ao site</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const nav = (
    <nav aria-label="Navegação do painel" className="flex flex-col">
      {NAV.map((item) => {
        const active = current?.to === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMenuOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative border-b border-hairline px-6 py-4 text-[0.8125rem] font-medium transition-colors",
              active ? "bg-graphite/60 text-ivory" : "text-stone hover:bg-graphite/30 hover:text-ivory",
            )}
          >
            {active && <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-bronze" />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const account = (
    <div className="border-t border-hairline px-6 py-5">
      <p className="eyebrow text-[0.5625rem] text-stone/70">Administrador</p>
      <p className="mt-1.5 truncate text-[0.8125rem] text-ivory/85">{user.email}</p>
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={signOut}
          className="link-line text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-ivory/80 hover:text-ivory"
        >
          Sair
        </button>
        <a
          href="/"
          className="link-line text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-stone hover:text-ivory"
        >
          Ver site
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-hairline bg-ink-soft lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex h-[4.5rem] items-center border-b border-hairline px-6">
          <Logo href="/admin" />
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        {account}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-hairline bg-ink/95 px-5 backdrop-blur lg:hidden">
          <Logo href="/admin" />
          <div className="flex min-w-0 items-center gap-4">
            <span className="eyebrow hidden truncate text-[0.5625rem] text-stone sm:inline">
              {current?.label}
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu do painel"
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
            >
              <span className="h-px w-6 bg-ivory" />
              <span className="h-px w-6 bg-ivory" />
            </button>
          </div>
        </header>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="left" className="flex w-72 flex-col gap-0 border-hairline bg-ink-soft p-0">
            <SheetTitle className="flex h-16 items-center border-b border-hairline px-6">
              <span className="eyebrow text-bronze">Painel</span>
            </SheetTitle>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            {account}
          </SheetContent>
        </Sheet>

        <main className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
