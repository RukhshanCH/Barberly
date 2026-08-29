import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_FEE_PERCENT } from "@/app/lib/constants";

export const metadata: Metadata = {
  title: "Terms and Conditions — Barberly",
  description: "The terms that govern use of Barberly by clients and barber shops.",
};

export default function TermsPage() {
  return (
    <section className="l-container legal">
      <header className="legal__header">
        <span className="legal__eyebrow">Legal</span>
        <h1 className="legal__title">Terms &amp; Conditions</h1>
        <p className="legal__updated">Last updated: August 29, 2026</p>
      </header>

      <nav className="legal__toc" aria-label="Sections">
        <span className="legal__toc-title">On this page</span>
        <a href="#overview">1. Overview</a>
        <a href="#accounts">2. Accounts &amp; roles</a>
        <a href="#services">3. What Barberly is (and isn&apos;t)</a>
        <a href="#booking">4. Bookings, deposits &amp; payment</a>
        <a href="#cancellations">5. Cancellations &amp; no-shows</a>
        <a href="#barber-obligations">6. Barber &amp; shop obligations</a>
        <a href="#client-conduct">7. Client conduct</a>
        <a href="#reviews">8. Reviews &amp; content</a>
        <a href="#liability">9. Liability</a>
        <a href="#changes">10. Changes to these terms</a>
        <a href="#contact">11. Contact</a>
      </nav>

      <div className="legal__body">
        <div className="legal__section" id="overview">
          <h2 className="legal__section-title">1. Overview</h2>
          <p>
            Barberly (&quot;Barberly&quot;, &quot;we&quot;, &quot;us&quot;) operates a discovery and appointment-booking
            platform that connects clients in Pakistan with independent barber shops (&quot;shops&quot;,
            &quot;barbers&quot;). By creating an account, browsing shops, or booking an appointment through
            Barberly, you agree to these Terms &amp; Conditions. If you do not agree, please do not use
            the platform.
          </p>
        </div>

        <div className="legal__section" id="accounts">
          <h2 className="legal__section-title">2. Accounts &amp; roles</h2>
          <p>
            Barberly has two account types: <strong>clients</strong>, who search for and book
            appointments, and <strong>barbers</strong>, who list one or more shops and manage their own
            calendars, staff, and services. You must provide accurate information when you sign up
            (name, phone number, and, for barbers, shop details) and keep your login credentials
            confidential. You&apos;re responsible for activity that happens under your account.
          </p>
        </div>

        <div className="legal__section" id="services">
          <h2 className="legal__section-title">3. What Barberly is (and isn&apos;t)</h2>
          <p>
            Barberly is a booking marketplace, not a barber shop. Every shop listed on the platform is
            an independent business responsible for its own services, pricing, staff, premises, and
            the quality of the haircut, shave, or grooming service it provides. Barberly does not
            employ barbers and does not supervise the in-shop service itself.
          </p>
        </div>

        <div className="legal__section" id="booking">
          <h2 className="legal__section-title">4. Bookings, deposits &amp; payment</h2>
          <p>
            When you book an appointment for a service that requires a deposit, you&apos;ll pay that
            deposit online at checkout through our payment partner, Safepay. Deposits are collected
            into a single Barberly merchant account, not directly by the shop. Barberly retains a{" "}
            {PLATFORM_FEE_PERCENT}% platform fee from each deposit and settles the remainder to the
            shop as a manual payout. The balance of the service price (anything beyond the deposit) is
            paid directly to the shop, in person, using whatever payment methods that shop accepts.
          </p>
          <p>
            Prices, service durations, and deposit amounts are set independently by each shop and are
            displayed on the shop&apos;s page before you book. Barberly is not responsible for pricing
            errors made by a shop, though we&apos;ll help resolve disputes where we reasonably can.
          </p>
        </div>

        <div className="legal__section" id="cancellations">
          <h2 className="legal__section-title">5. Cancellations &amp; no-shows</h2>
          <p>
            Each shop sets its own cancellation cutoff window (shown at booking time). You may cancel a
            confirmed appointment yourself up until that cutoff. Cancelling after the cutoff, or simply
            not showing up, may result in the deposit being forfeited to the shop and the appointment
            being marked as a no-show on your account. Repeated no-shows may limit your ability to book
            with deposit-requiring shops in future. See our{" "}
            <Link href="/refund-policy">Refund, Cancellation &amp; Policies</Link> page for full
            details.
          </p>
        </div>

        <div className="legal__section" id="barber-obligations">
          <h2 className="legal__section-title">6. Barber &amp; shop obligations</h2>
          <ul>
            <li>Keep your service list, pricing, deposit amounts, and shop hours accurate and current.</li>
            <li>Honour appointments booked and confirmed through Barberly.</li>
            <li>Only mark an appointment as completed, cancelled, or no-show in good faith.</li>
            <li>
              Provide a valid business bank account for payout settlement and respond to payout
              queries from Barberly&apos;s admin team.
            </li>
            <li>Comply with all applicable Pakistani laws and regulations relevant to operating a barber shop.</li>
          </ul>
        </div>

        <div className="legal__section" id="client-conduct">
          <h2 className="legal__section-title">7. Client conduct</h2>
          <p>
            Please book appointments you intend to keep, arrive on time, and treat shop staff
            respectfully. We may suspend accounts that repeatedly abuse the booking system (for
            example, chronic no-shows or fraudulent chargebacks).
          </p>
        </div>

        <div className="legal__section" id="reviews">
          <h2 className="legal__section-title">8. Reviews &amp; content</h2>
          <p>
            Clients may leave a review after a completed appointment. Reviews must reflect genuine
            experiences and must not contain harassment, hate speech, or unrelated advertising. We may
            remove reviews that violate these terms.
          </p>
        </div>

        <div className="legal__section" id="liability">
          <h2 className="legal__section-title">9. Liability</h2>
          <p>
            Barberly provides the booking platform &quot;as is&quot; and does not guarantee availability,
            uninterrupted service, or the outcome of any haircut or grooming service. To the maximum
            extent permitted by law, Barberly is not liable for indirect or consequential losses
            arising from your use of the platform or from services provided by an independent shop.
          </p>
        </div>

        <div className="legal__section" id="changes">
          <h2 className="legal__section-title">10. Changes to these terms</h2>
          <p>
            We may update these Terms from time to time. If we make material changes, we&apos;ll update
            the &quot;Last updated&quot; date above. Continuing to use Barberly after changes take effect
            means you accept the revised terms.
          </p>
        </div>

        <div className="legal__section" id="contact">
          <h2 className="legal__section-title">11. Contact</h2>
          <p>
            Questions about these Terms? Reach us via the details on our{" "}
            <Link href="/contact">Contact page</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
