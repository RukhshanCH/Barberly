import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_FEE_PERCENT } from "@/app/lib/constants";

export const metadata: Metadata = {
  title: "Refund, Cancellation & Policies — Barberly",
  description:
    "How deposit refunds, appointment cancellations, no-shows, and service fulfilment work on Barberly.",
};

export default function RefundPolicyPage() {
  return (
    <section className="l-container legal">
      <header className="legal__header">
        <span className="legal__eyebrow">Legal</span>
        <h1 className="legal__title">Refund, Cancellation &amp; Policies</h1>
        <p className="legal__updated">Last updated: August 29, 2026</p>
      </header>

      <nav className="legal__toc" aria-label="Sections">
        <span className="legal__toc-title">On this page</span>
        <a href="#deposits">1. About deposits</a>
        <a href="#cancel-by-client">2. Cancelling as a client</a>
        <a href="#no-show">3. No-shows</a>
        <a href="#cancel-by-shop">4. Cancellation or rescheduling by a shop</a>
        <a href="#refund-timelines">5. Refund timelines</a>
        <a href="#delivery">6. Service fulfilment (&quot;delivery&quot;)</a>
        <a href="#disputes">7. Disputes</a>
        <a href="#contact">8. Contact</a>
      </nav>

      <div className="legal__body">
        <div className="legal__section" id="deposits">
          <h2 className="legal__section-title">1. About deposits</h2>
          <p>
            Some services require a deposit to confirm a booking. The deposit amount is set by the
            shop and shown before you pay. Deposits are collected through Safepay into Barberly&apos;s
            merchant account, and a {PLATFORM_FEE_PERCENT}% platform fee is deducted before the
            remainder is paid out to the shop. The deposit is always credited towards the total price
            of your service — it is not an extra charge.
          </p>
        </div>

        <div className="legal__section" id="cancel-by-client">
          <h2 className="legal__section-title">2. Cancelling as a client</h2>
          <p>
            Every shop sets its own <strong>cancellation cutoff window</strong> (for example, 2 hours
            before the appointment), shown on the shop&apos;s page and at checkout. You can cancel a
            confirmed appointment yourself from your appointments list at any point before that cutoff,
            and your deposit will be refunded in full to your original payment method.
          </p>
          <p>
            Cancelling after the cutoff has passed is treated the same as a no-show (see below): the
            deposit is generally forfeited to the shop to compensate them for the reserved time slot.
          </p>
        </div>

        <div className="legal__section" id="no-show">
          <h2 className="legal__section-title">3. No-shows</h2>
          <p>
            If you don&apos;t arrive for a confirmed appointment and haven&apos;t cancelled it, the shop may
            mark it as a <strong>no-show</strong>. When this happens:
          </p>
          <ul>
            <li>Any deposit paid is forfeited to the shop and is not refunded.</li>
            <li>A no-show is recorded against your account.</li>
            <li>Repeated no-shows may restrict your ability to book deposit-requiring services in future.</li>
          </ul>
        </div>

        <div className="legal__section" id="cancel-by-shop">
          <h2 className="legal__section-title">4. Cancellation or rescheduling by a shop</h2>
          <p>
            If a shop cancels your appointment (for example, due to staff unavailability), you&apos;ll be
            notified in-app and your deposit will be refunded in full. You&apos;re welcome to rebook a new
            time with the same shop or any other shop on Barberly.
          </p>
        </div>

        <div className="legal__section" id="refund-timelines">
          <h2 className="legal__section-title">5. Refund timelines</h2>
          <p>
            Eligible refunds are initiated through Safepay back to your original payment method.
            Safepay and your bank or card issuer determine how long the refund takes to reflect in
            your account, which is typically a few business days but can occasionally take longer
            depending on your bank.
          </p>
        </div>

        <div className="legal__section" id="delivery">
          <h2 className="legal__section-title">6. Service fulfilment (&quot;delivery&quot;)</h2>
          <p>
            Barberly does not ship or deliver any physical product. What you&apos;re booking is a{" "}
            <strong>time slot at a physical barber shop</strong>: the haircut, shave, or grooming
            service itself is performed in person, at the shop&apos;s premises, at the date and time you
            booked. There is no separate delivery process or delivery fee — &quot;fulfilment&quot; of your
            booking simply means showing up for your appointment.
          </p>
        </div>

        <div className="legal__section" id="disputes">
          <h2 className="legal__section-title">7. Disputes</h2>
          <p>
            If you believe a deposit was wrongly forfeited, or a shop marked you as a no-show in error,
            contact us with your appointment details and we&apos;ll review it with the shop. We aim to
            resolve disputes fairly and promptly for both clients and shops.
          </p>
        </div>

        <div className="legal__section" id="contact">
          <h2 className="legal__section-title">8. Contact</h2>
          <p>
            For refund or cancellation questions, reach us via the details on our{" "}
            <Link href="/contact">Contact page</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
