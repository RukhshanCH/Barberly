import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Support — Barberly",
  description: "Get in touch with Barberly for customer support or merchant enquiries.",
};

export default function ContactPage() {
  return (
    <section className="l-container legal">
      <header className="legal__header">
        <span className="legal__eyebrow">Support</span>
        <h1 className="legal__title">Contact &amp; Support</h1>
        <p className="legal__updated">We usually reply within one business day.</p>
      </header>

      <div className="legal__body" style={{ maxWidth: "none" }}>
        <div className="legal__section">
          <p>
            Whether you&apos;re a client with a question about a booking or a deposit, or a barber shop
            with a question about your listing or payouts, here&apos;s how to reach the Barberly team.
          </p>
        </div>

        <div className="contact-card">
          <div className="contact-card__item">
            <span className="contact-card__label">Customer support</span>
            <p className="contact-card__value">
              <a href="mailto:ch.rukhshan@gmail.com">ch.rukhshan@gmail.com</a> {/* support@barberly.pk */}
            </p>
            <p className="contact-card__hint">
              For booking issues, deposit or refund questions, and account help.
            </p>
          </div>

          <div className="contact-card__item">
            <span className="contact-card__label">Merchant / barber enquiries</span>
            <p className="contact-card__value">
              <a href="mailto:rukhshanshahid.work@gmail.com">rukhshanshahid.work@gmail.com</a> {/* partners@barberly.pk */}
            </p>
            <p className="contact-card__hint">For shop onboarding, payouts, and platform questions.</p>
          </div>

          <div className="contact-card__item">
            <span className="contact-card__label">Phone</span>
            <p className="contact-card__value">
              <a href="tel:+923000941566">+92 (00) 094-1566</a>
            </p>
            <p className="contact-card__hint">Available Monday–Saturday, 10am–7pm PKT.</p>
          </div>

          <div className="contact-card__item">
            <span className="contact-card__label">Registered business</span>
            <p className="contact-card__value">Barberly</p>
            <p className="contact-card__hint">Lahore, Punjab, Pakistan.</p>
          </div>
        </div>

        <div className="legal__note" style={{ marginTop: "var(--space-6)" }}>
          <p>
            Looking for policy details instead? See our{" "}
            <a href="/terms">Terms &amp; Conditions</a>, <a href="/privacy">Privacy Policy</a>, or{" "}
            <a href="/refund-policy">Refund &amp; Cancellation Policy</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
