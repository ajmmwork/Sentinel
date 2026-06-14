import { LoginForm } from "@/components/login-form";
import "./login.css";

export default function Login() {
  return (
    <main className="login-page">
      <div className="login-shell">
        <LoginForm />
      </div>
    </main>
  );
}
