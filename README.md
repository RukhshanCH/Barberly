# Barberly

A barber-shop discovery and appointment booking app.

- **Barbers** create an account, list their shop, add services (name, price,
  duration) and set weekly opening hours.
- **Clients** create an account, search shops by name/city, view a shop's
  services and hours, and book an open time slot.
- Auth, database and row-level security are all handled by **Supabase**.

Stack: **Next.js 14 (App Router) + TypeScript**, plain **CSS with BEM**
naming (no Tailwind, no CSS-in-JS, no component library).

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Once it's ready, open **SQL Editor** → paste the contents of
   `supabase/schema.sql` → **Run**. This creates every table, the
   `handle_new_user` trigger (auto-creates a `profiles` row on signup), and
   the Row Level Security policies.
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key

## 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in the two values you copied:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Auth email settings

By default Supabase requires email confirmation before a session is
created. For local testing you can turn this off in **Authentication →
Providers → Email → "Confirm email"**, or just click the confirmation link
Supabase emails to the test address (check **Authentication → Users → Logs**
if you don't have SMTP configured yet).

Also set the **Site URL** and **Redirect URLs** in **Authentication → URL
Configuration** to `http://localhost:3000` (and `http://localhost:3000/auth/callback`)
for local dev, and to your real domain once deployed.

## 4. Try it out

1. Sign up as a **barber** → you'll land on an empty dashboard → "List your
   shop" → fill in the shop → add a couple of services → set opening hours.
2. Open an incognito window, sign up as a **client** → search for the shop
   you just created → pick a service, a day and a time slot → confirm.
3. Back in the barber dashboard, confirm or decline the booking.
4. As the client, check **My appointments** to see the booking status.

---

## Project structure

```
src/
  app/                     Next.js App Router pages
    (auth)/login, signup   Auth screens
    auth/callback          Supabase email-confirmation redirect handler
    barber/dashboard       Barber's appointment inbox + stats
    barber/shop/new        Create-shop form
    barber/shop/[shopId]   Manage services & opening hours
    shops/[shopId]         Public shop page + booking flow
    appointments           Client's own appointment list
    page.tsx                Landing page + shop search
  components/              Shared UI, one folder per component
  lib/supabase/            Browser client, server client, middleware helper
  lib/utils/date.ts        Time-slot generation, formatting
  styles/                  variables.css, base.css, layout.css, components.css
  types/database.types.ts  Hand-written types matching schema.sql
supabase/schema.sql        Tables, indexes, RLS policies, signup trigger
```

## CSS approach

No framework — plain CSS files imported once in `src/styles/globals.css`,
using BEM (`.block`, `.block__element`, `.block--modifier`). Design tokens
(colors, type, spacing) live in `src/styles/variables.css` as CSS custom
properties, so re-theming the app means editing one file.

## Data model (see `supabase/schema.sql`)

- `profiles` — one row per auth user, `role` is `barber` or `client`
  (created automatically on signup by a Postgres trigger).
- `shops` — owned by a barber (`owner_id`), one shop per barber in this MVP.
- `services` — belong to a shop: name, price, duration.
- `shop_hours` — one row per weekday per shop (open/close time or closed).
- `appointments` — links a client, a shop and a service to a time range and
  a status (`pending → confirmed → completed`, or `cancelled`). Row Level
  Security means clients only ever see their own bookings, and barbers only
  see bookings for their own shop.
- `reviews` — rating + comment, tied to a completed appointment. The schema
  is ready for this even though the UI only reads/displays an average for
  now (see "Ideas for what's next" below).

Booking a slot works by generating candidate start times from the shop's
opening hours and the chosen service's duration
(`src/lib/utils/date.ts#buildTimeSlots`), then filtering out any that
overlap an existing, non-cancelled appointment for that shop and day. This
is fine for a single-chair shop; see the notes below if you plan to support
multiple barbers per shop.

---

## Ideas for what's next

A few things you didn't ask for but that most appointment apps like this
end up needing — happy to build any of these out, just say which one:

- **Multiple barbers per shop.** Right now a shop has one owner and every
  appointment is implicitly "with the shop." Real shops usually have several
  barbers with independent schedules. This means a `shop_staff` table
  (barber ↔ shop, since a barber could work at more than one), an optional
  `staff_id` on `appointments`, and letting the client pick a barber (or
  "any available") as part of booking.
- **Notifications.** Email or SMS when a booking is made, confirmed, or
  cancelled — a Supabase Edge Function triggered by a database webhook on
  `appointments` insert/update is the natural fit, plus a reminder a few
  hours before the appointment.
- **Cancellation / no-show policies.** A cutoff (e.g. "can't cancel within
  2 hours") and a no-show counter per client, since these directly affect a
  shop's revenue.
- **Photos.** Shop cover photo and a small gallery (haircut portfolio) via
  Supabase Storage — the schema already has `cover_image_url` on `shops` to
  build on.
- **Reviews UI.** The `reviews` table and RLS policy already exist (a
  client can review only their own completed appointment); it just needs a
  form on the appointments page and a list on the shop page.
- **Real location search.** `latitude`/`longitude` columns are on `shops`
  already; "near me" search would mean asking for the browser's geolocation
  and sorting/filtering by distance (Postgres' `earthdistance` extension or
  PostGIS if you want proper radius queries).
- **Payments / deposits.** Stripe Checkout for a booking deposit reduces
  no-shows — usually the single highest-leverage addition for a paid
  booking product.
- **Waitlist.** If a client's preferred slot is taken, let them join a
  waitlist and auto-notify them if it opens up from a cancellation.

## Deploying

The app is a standard Next.js app, so it deploys as-is to Vercel (or any
Node host): push this repo, import it in Vercel, add the two
`NEXT_PUBLIC_SUPABASE_*` environment variables in the project settings, and
update Supabase's **Site URL** / **Redirect URLs** to the deployed domain.
