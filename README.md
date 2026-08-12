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

## Upgrade pack (v2)

Eight things have been added on top of the original MVP. After pulling
these files in, run the extra SQL and you're set:

1. Open the Supabase SQL editor and run **`supabase/upgrades.sql`**
   (after `supabase/schema.sql`, which you should already have run). It's
   additive/idempotent — safe to re-run.
2. Add the two new keys to `.env.local` (service role key, and Stripe keys
   if you want deposits) — see the updated `.env.local.example`.
3. `npm install` (adds the `stripe` package).

### 1. Multiple barbers per shop
A shop can now list individual barbers (`shop_staff`). Clients pick a
named barber or "Any available" when booking; each barber's calendar is
tracked independently via `appointments.staff_id`. Manage staff from
**Manage shop → Barbers**.

### 2. Reviews UI
Clients get a review form under each **completed** appointment on
`/appointments` (one review per appointment, enforced by RLS). The shop
page lists all reviews and shows the average rating.

### 3. Cancellation / no-show policy
Each shop sets a cancellation cutoff (30 min – 24 hrs) under **Manage shop
→ Cancellation policy**. Row Level Security itself blocks a client's
cancel-update once an appointment is inside that window — it's enforced
in the database, not just the UI. Barbers can mark a confirmed appointment
**No-show**, which increments a counter on that client's profile, visible
next to their name in the barber's appointment table.

### 4. Photos
`supabase/upgrades.sql` creates a public `shop-photos` Storage bucket with
policies so only a shop's owner can upload/delete its files (checked by a
`<shop_id>/<filename>` path prefix). Upload from **Manage shop → Photos**;
photos show in a gallery on the public shop page.

### 5. Real "near me" search
The homepage has a **📍 Shops near me** button that asks the browser for
your location, then calls a `nearby_shops(lat, lng, radius_km)` Postgres
function (plain-SQL haversine distance — no PostGIS extension needed) and
shows results sorted by distance.

### 6. Notifications
In-app notifications (bell icon in the navbar + `/notifications` page) work
immediately — a database trigger writes a row whenever a booking is
requested, confirmed, cancelled, completed, or a waitlist slot opens.
Real email delivery is **optional**: `supabase/functions/notify-email`
is a Supabase Edge Function you can deploy and wire to a Database Webhook
on `notifications` inserts (see the comment at the top of that file for
the 3-step setup with Resend). The app doesn't require it.

### 7. Payments / deposits
Set a **deposit** (Rs) on any service in **Manage shop → Services**. If a
service has a deposit, booking it redirects the client to Stripe Checkout;
a webhook (`/api/stripe-webhook`) marks the appointment `paid` and
`confirmed` only after Stripe confirms payment — the browser can never
fake this. Zero-deposit services book exactly as before, no Stripe
involved. To enable:
   - Add `STRIPE_SECRET_KEY` to `.env.local`.
   - `stripe listen --forward-to localhost:3000/api/stripe-webhook` for
     local testing (the CLI prints a webhook secret — put that in
     `STRIPE_WEBHOOK_SECRET`), or add a hosted webhook endpoint pointing
     at `/api/stripe-webhook` in the Stripe dashboard once deployed.

### 8. Waitlist
If a client picks a day with no open slots, they see **Join the waitlist**
instead of an empty grid. If another client later cancels an appointment
for that shop/day, the same database trigger that powers notifications
finds matching waitlist entries and notifies those clients that a slot
opened up. Barbers can see who's waiting under **Dashboard → Waitlist**.

### New/changed files in this upgrade
```
supabase/upgrades.sql                        new tables, RLS, triggers, storage bucket
supabase/functions/notify-email/index.ts     optional email Edge Function
src/types/database.types.ts                  new types (staff, photos, notifications, waitlist, payments)
src/lib/stripe.ts                            Stripe client helper
src/lib/supabase/admin.ts                    service-role client (webhook only)
src/app/api/create-checkout-session/route.ts creates appointment + Stripe session
src/app/api/stripe-webhook/route.ts          confirms payment server-side
src/app/booking/confirmation/page.tsx        post-Stripe-redirect landing page
src/app/notifications/                       notifications inbox
src/components/StaffManager/                 barber: add/hide/remove staff
src/components/PhotoUploader/                barber: upload/delete shop photos
src/components/PhotoGallery/                 public: shop photo grid
src/components/ReviewForm/, ReviewList/      client review + public review list
src/components/NotificationBell/             navbar unread badge
src/components/WaitlistForm/                 join-waitlist CTA on empty days
src/components/NearMeSearch/                 geolocation "near me" search
src/app/barber/shop/[shopId]/CancellationPolicyForm.tsx
Updated: BookingForm, ServiceManager, CancelAppointmentButton, Navbar,
appointments page, barber dashboard, manage-shop page, shop detail page,
homepage, components.css, package.json, .env.local.example
```


## Deploying

The app is a standard Next.js app, so it deploys as-is to Vercel (or any
Node host): push this repo, import it in Vercel, add the
`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, and (if using
deposits) `STRIPE_*` environment variables in the project settings, point
your Stripe webhook at `https://yourdomain.com/api/stripe-webhook`, and
update Supabase's **Site URL** / **Redirect URLs** to the deployed domain.
