import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { validatePassword } from "@/utilities/auth.js";
import { signupUser } from "@/utilities/api"

const REDIRECT_DELAY_MS = 3000;

export function SignupForm({
  ...props
}) {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isErrorFading, setIsErrorFading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  function showError(message) {
    setSuccessMessage("");
    setErrorMessage(message);
    setIsErrorFading(false);

    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
    }

    fadeTimerRef.current = setTimeout(() => {
      setIsErrorFading(true);
    }, 4300);

    errorTimerRef.current = setTimeout(() => {
      setErrorMessage("");
      setIsErrorFading(false);
      errorTimerRef.current = null;
      fadeTimerRef.current = null;
    }, 5000);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");


    const passwordError = validatePassword(password, confirmPassword);

    if (passwordError) {
      showError(passwordError);
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const firstName = formData.get("firstName")
    const lastName = formData.get("lastName")
    const email = formData.get("email")

    const payload = {
      firstName,
      lastName,
      email,
      password
    }

    setIsSubmitting(true);

    try {
      const result = await signupUser(payload);

      if (!result.ok) {
        showError(result.data?.detail || "Signup failed. Please try again.");
        return;
      }

      setSuccessMessage(result.data?.message || "Verification code sent. Redirecting you now.");
      await new Promise((resolve) => setTimeout(resolve, REDIRECT_DELAY_MS));
      window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
    } catch (error) {
      showError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="sentinel-signup-card" {...props}>
      <CardHeader>
        <div className="sentinel-signup-brand">
          <div>
            <p className="sentinel-signup-name">SENTINEL</p>
            <p className="sentinel-signup-tagline">Market intelligence with AI</p>
          </div>
        </div>
        <CardTitle className="sentinel-signup-title">Create your account</CardTitle>
        <CardDescription className="sentinel-signup-description">
          Start building your daily market brief.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <Alert className={`sentinel-signup-alert${isErrorFading ? " is-fading" : ""}`}>
              <AlertTitle>Check your signup details</AlertTitle>
              <AlertDescription className="whitespace-pre-line">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="sentinel-signup-success-alert">
              <AlertTitle>Account started</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <FieldGroup className="sentinel-signup-form-group">
            <div className="sentinel-signup-name-grid">
              <Field>
                <FieldLabel className="sentinel-signup-field" htmlFor="firstName">
                  First Name
                </FieldLabel>
                <Input
                  className="sentinel-signup-input"
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Alejandro"
                  required
                />
              </Field>
              <Field>
                <FieldLabel className="sentinel-signup-field" htmlFor="lastName">
                  Last Name
                </FieldLabel>
                <Input
                  className="sentinel-signup-input"
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Morales"
                  required
                />
              </Field>
            </div>
            <Field>
              <FieldLabel className="sentinel-signup-field" htmlFor="email">Email</FieldLabel>
              <Input
                className="sentinel-signup-input"
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel className="sentinel-signup-field" htmlFor="password">
                Password
              </FieldLabel>
              <Input
                className="sentinel-signup-input"
                id="password"
                name="password"
                type="password"
                required
              />
            </Field>
            <Field>
              <FieldLabel className="sentinel-signup-field" htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                className="sentinel-signup-input"
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
              />
            </Field>
            <FieldGroup>
              <Field>
                <Button className="sentinel-signup-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>
                <Button className="sentinel-signup-secondary" variant="outline" type="button">
                  Sign up with Google
                </Button>
                <FieldDescription className="sentinel-signup-description-text px-6 text-center">
                  Already have an account?{" "}
                  <a className="sentinel-signup-link" href="/login">
                    Sign in
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
        <div className="sentinel-signup-signal">Account setup ready</div>
      </CardContent>
    </Card>
  );
}
