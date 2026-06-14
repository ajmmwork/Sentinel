import { VerifyEmailForm } from "@/components/verify-email-form";
import "./verify-email.css";

export default function VerifyEmail() {
  return (
    <main className="verify-page">
      <div className="verify-shell">
        <VerifyEmailForm />
      </div>
    </main>
  );
}
