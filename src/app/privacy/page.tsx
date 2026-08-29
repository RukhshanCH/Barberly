import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Barberly",
  description: "How Barberly collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <section className="l-container legal">
      <header className="legal__header">
        <span className="legal__eyebrow">Legal</span>
        <h1 className="legal__title">Privacy Policy</h1>
        <p className="legal__updated">Last updated: August 29, 2026</p>
      </header>

      <nav className="legal__toc" aria-label="Sections">
        <span className="legal__toc-title">On this page</span>
        <a href="#what-we-collect">1. Information we collect</a>
        <a href="#how-we-use">2. How we use your information</a>
        <a href="#payments">3. Payment data</a>
        <a href="#sharing">4. Who we share data with</a>
        <a href="#storage">5. Storage &amp; security</a>
        <a href="#retention">6. Data retention</a>
        <a href="#rights">7. Your choices</a>
        <a href="#location">8. Location data</a>
        <a href="#children">9. Children</a>
        <a href="#changes">10. Changes to this policy</a>
        <a href="#contact">11. Contact</a>
      </nav>

      <div className="legal__body">
        <div className="legal__section" id="what-we-collect">
          <h2 className="legal__section-title">1. Information we collect</h2>
          <p>When you use Barberly, we collect:</p>
          <ul>
            <li>
              <strong>Account information</strong> — your name, phone number, email address, and
              password (handled securely by our authentication provider), and whether you&apos;re a
              client or a barber.
            </li>
            <li>
              <strong>Shop information</strong> (barbers only) — shop name, address, coordinates,
              photos, services, prices, deposit amounts, and staff details.
            </li>
            <li>
              <strong>Booking information</strong> — appointment times, selected services, notes you
              add to a booking, and your booking history including cancellations and no-shows.
            </li>
            <li>
              <strong>Payment information</strong> — handled by our payment partner, Safepay; see
              &quot;Payment data&quot; below.
            </li>
            <li>
              <strong>Location data</strong> — if you use &quot;near me&quot; search, we request your
              device&apos;s coordinates to find nearby shops. This is only used for that search and is
              not stored against your profile.
            </li>
            <li>
              <strong>Reviews</strong> — ratings and written reviews you choose to submit after a
              completed appointment.
            </li>
          </ul>
        </div>

        <div className="legal__section" id="how-we-use">
          <h2 className="legal__section-title">2. How we use your information</h2>
          <ul>
            <li>To create and manage your account and let you switch between client and barber tools.</li>
            <li>To let clients discover shops and book appointments, and let barbers manage bookings.</li>
            <li>To process deposit payments and reconcile payouts to shops.</li>
            <li>To send booking notifications (confirmations, cancellations, waitlist updates) in-app and, where enabled, by email.</li>
            <li>To calculate distance-based search results ( &quot;shops near me&quot;).</li>
            <li>To maintain trust and safety on the platform, including tracking no-shows.</li>
            <li>To comply with legal and financial obligations, including those related to payment processing.</li>
          </ul>
        </div>

        <div className="legal__section" id="payments">
          <h2 className="legal__section-title">3. Payment data</h2>
          <p>
            Barberly does not store your full card details. Deposit payments are processed by{" "}
            <strong>Safepay</strong> (getsafepay.com), a licensed payment gateway. Safepay handles card
            data directly and shares with Barberly only what&apos;s needed to confirm a payment (such as
            a transaction reference and status), which we use to update your appointment. Please refer
            to Safepay&apos;s own privacy policy for how they handle payment data.
          </p>
        </div>

        <div className="legal__section" id="sharing">
          <h2 className="legal__section-title">4. Who we share data with</h2>
          <p>We share the minimum information necessary to operate the platform:</p>
          <ul>
            <li>With the shop you book, so they can prepare for your appointment (name, phone, selected service, time).</li>
            <li>With Safepay, to process deposit payments.</li>
            <li>With our infrastructure providers (Supabase for database, authentication and storage; Vercel for hosting), who process data on our behalf.</li>
            <li>Where required by law, regulation, or a valid legal request.</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </div>

        <div className="legal__section" id="storage">
          <h2 className="legal__section-title">5. Storage &amp; security</h2>
          <p>
            Your data is stored in Supabase&apos;s managed PostgreSQL database with row-level security
            rules that restrict who can read or modify each record (for example, only you can see your
            own appointments, and only a shop&apos;s owner can see that shop&apos;s bookings). Photos are
            stored in Supabase Storage. We use industry-standard measures to protect data in transit
            and at rest, but no online service can guarantee absolute security.
          </p>
        </div>

        <div className="legal__section" id="retention">
          <h2 className="legal__section-title">6. Data retention</h2>
          <p>
            We keep your account and booking history for as long as your account is active, so you can
            see your appointment history and shops can honour warranty or repeat-booking requests. If
            you delete your account, we&apos;ll remove or anonymize personal data within a reasonable
            period, except where we&apos;re required to retain records (for example, payment records) for
            legal or accounting purposes.
          </p>
        </div>

        <div className="legal__section" id="rights">
          <h2 className="legal__section-title">7. Your choices</h2>
          <ul>
            <li>You can view and update your profile information at any time while logged in.</li>
            <li>You can request a copy of your data, or ask us to delete your account, via our <Link href="/contact">Contact page</Link>.</li>
            <li>You can decline location access; &quot;near me&quot; search simply won&apos;t work without it.</li>
          </ul>
        </div>

        <div className="legal__section" id="location">
          <h2 className="legal__section-title">8. Location data</h2>
          <p>
            Shop coordinates (set by barbers when creating a shop) are public, since they power search
            and maps. A client&apos;s live device location, used for &quot;near me&quot; search, is only used to
            compute distance at the time of the search and is not saved.
          </p>
        </div>

        <div className="legal__section" id="children">
          <h2 className="legal__section-title">9. Children</h2>
          <p>
            Barberly is intended for users who are at least 18 years old, or the age of majority in
            their jurisdiction. We do not knowingly collect personal information from children.
          </p>
        </div>

        <div className="legal__section" id="changes">
          <h2 className="legal__section-title">10. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be reflected by
            updating the &quot;Last updated&quot; date above.
          </p>
        </div>

        <div className="legal__section" id="contact">
          <h2 className="legal__section-title">11. Contact</h2>
          <p>
            Questions about this Privacy Policy or your data? Reach us via the details on our{" "}
            <Link href="/contact">Contact page</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
