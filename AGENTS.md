<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- The landing page is one scrolling page at `/` built from section components in `src/components/site/`; header links are in-page anchors with smooth scroll because the brief asks for a single landing page with section navigation.
- Brand colors live only as tokens in `src/styles.css` (ink, graphite, bronze, ivory, stone…); components use those token classes, never raw hex, so the fixed brand palette stays enforceable.
- Services, barbers, hours and prices live only in the database; the landing, the `/agendar` flow and the admin panel all read the same tables, and photos are mapped by slug in `src/lib/booking/images.ts`, so the dashboard is the single source of truth.
- Availability and booking rules run in Postgres (`get_available_slots`, `book_appointment`, `admin_reschedule_appointment`) plus an exclusion constraint on active appointments, because conflicts must be rejected server-side even under simultaneous requests; never compute or trust availability only in the browser.
- Appointments store snapshots of service name, price, duration and barber name; a trigger enforces status transitions and blocks direct time/barber edits outside the reschedule function, so history never changes when the catalog does.
- Admin pages live under `src/routes/_authenticated/admin/` and query through the signed-in browser client; row-level security with `is_admin()` is the real access boundary, the route check is only UX.
- Shop time is America/Sao_Paulo with a fixed -03:00 offset in client helpers (`src/lib/booking/core.ts`), since Brazil has no daylight saving time; the database uses the timezone name from `booking_settings`.
- Admin provisioning must be an explicit trusted role assignment, never automatic on account creation, because signup settings can change independently of role security.
- Administrative leaf routes use shared non-indexable metadata; password recovery uses the existing auth provider and public callback pages, with delivery verified separately from request acceptance.
- Weekly shop hours and barber profile/service assignments are saved by transactional, admin-checked database functions to avoid partial saves; appointment reads paginate with a stable secondary key instead of silently truncating indicators.
