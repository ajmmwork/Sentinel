import { SignupForm } from "@/components/signup-form";
import "./signup.css";

export default function SignUp() {
  return (
    <main className="signup-page">
      <div className="signup-shell">
        <SignupForm />
      </div>
    </main>
  );
}
