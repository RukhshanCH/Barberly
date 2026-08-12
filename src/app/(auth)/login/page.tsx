import { AuthForm } from "@/components/AuthForm/AuthForm";

export default function LoginPage() {
  return (
    <section className="l-section l-container">
      <AuthForm mode="login" />
    </section>
  );
}
