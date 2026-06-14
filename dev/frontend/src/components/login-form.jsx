import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import sentinelMoneyBot from "@/assets/sentinel-money-bot.png"
import { useState } from "react"
import { login, saveSessionToken } from "@/utilities/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const REDIRECT_DELAY_MS = 3000;

export function LoginForm({
  className,
  ...props
}) {

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function showError(message) {
    setSuccessMessage("");
    setErrorMessage(message);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")
    const password = formData.get("password")

    if (!(email && password)) {
      setErrorMessage("Email and password must be included")
      setSuccessMessage("")
      return 
    }

    const payload = {
      email,
      password
    }

    setIsSubmitting(true)
    setErrorMessage("")
    setSuccessMessage("")
    try {
      const result = await login(payload, "login");

      if (!result.ok) {
        showError(result.data?.detail || "Login failed. Please try again.");
        return;
      }

      if (result.data?.session_token) {
        saveSessionToken(result.data.session_token);
      }

      setSuccessMessage(result.data?.message || "Login successful. Redirecting you now.");
      await new Promise((resolve) => setTimeout(resolve, REDIRECT_DELAY_MS));
      window.location.href = `/home`;
    } catch (error) {
      showError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }

  }


  return (
    <div className={cn("sentinel-login-frame flex flex-col gap-6", className)} {...props}>
      <Card className="sentinel-login-card overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="sentinel-login-form" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="sentinel-login-brand">
                  <div>
                    <p className="sentinel-login-name">SENTINEL</p>
                    <p className="sentinel-login-tagline">Market intelligence with AI</p>
                  </div>
                </div>
                <h1 className="sentinel-login-title text-2xl font-bold">Welcome back</h1>
                <p className="sentinel-login-description text-balance">
                  Log in to your Sentinel market brief.
                </p>
              </div>
              {errorMessage && (
                <Alert className="sentinel-login-alert">
                  <AlertTitle>Check your login details</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert className="sentinel-login-success-alert">
                  <AlertTitle>Login successful</AlertTitle>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}
              <Field>
                <FieldLabel className="sentinel-login-field" htmlFor="email">Email</FieldLabel>
                <Input
                  className="sentinel-login-input"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel className="sentinel-login-field" htmlFor="password">
                    Password
                  </FieldLabel>
                  <a href="#" className="sentinel-login-link ml-auto text-sm">
                    Forgot your password?
                  </a>
                </div>
                <Input className="sentinel-login-input" name="password" id="password" type="password" required />
              </Field>
              <Field>
                <Button className="sentinel-login-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </Field>
              <div className="sentinel-login-social">
                <Button className="sentinel-login-secondary sentinel-login-google" variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor" />
                  </svg>
                  <span className="sr-only">Login with Google</span>
                </Button>
              </div>
              <FieldDescription className="sentinel-login-muted text-center">
                Don&apos;t have an account? <a className="sentinel-login-link" href="/">Sign up</a>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="sentinel-login-visual hidden md:block">
            <img
              src={sentinelMoneyBot}
              alt=""
              className="sentinel-login-bot" />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="sentinel-login-muted px-6 text-center">
        By continuing, you agree to Sentinel&apos;s{" "}
        <a className="sentinel-login-link" href="#">Terms</a> and{" "}
        <a className="sentinel-login-link" href="#">Privacy Policy</a>.
      </FieldDescription>
      <div className="sentinel-login-signal">Secure sign-in ready</div>
    </div>
  );
}
