import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useRef, useState } from "react";
import { resendOTP, saveSessionToken, verifyEmail } from "@/utilities/api";

const REDIRECT_DELAY_MS = 3000;

export function VerifyEmailForm({ ...props }) {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isMessageFading, setIsMessageFading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const messageTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  function clearMessageTimers() {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
    }
  }

  function showTimedMessage(message, type) {
    clearMessageTimers();
    setIsMessageFading(false);

    if (type === "success") {
      setSuccessMessage(message);
      setErrorMessage("");
    } else {
      setErrorMessage(message);
      setSuccessMessage("");
    }

    fadeTimerRef.current = setTimeout(() => {
      setIsMessageFading(true);
    }, 4300);

    messageTimerRef.current = setTimeout(() => {
      setErrorMessage("");
      setSuccessMessage("");
      setIsMessageFading(false);
      messageTimerRef.current = null;
      fadeTimerRef.current = null;
    }, 5000);
  }

  function showError(message) {
    showTimedMessage(message, "error");
  }

  function showSuccess(message) {
    showTimedMessage(message, "success");
  }

  function clearMessages() {
    clearMessageTimers();
    setErrorMessage("");
    setSuccessMessage("");
    setIsMessageFading(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");

    if (!email) {
      showError("Missing email address. Please return to signup.");
      return;
    }

    if (code.length !== 6) {
      showError("Enter the 6-digit verification code.");
      return;
    }

    clearMessages();
    setIsVerifying(true);

    try {
      const result = await verifyEmail({ email, code });

      if (!result.ok) {
        showError(result.data?.detail || "Verification failed. Please try again.");
        return;
      }

      if (result.data?.session_token) {
        saveSessionToken(result.data.session_token);
      }

      showSuccess(result.data?.message || "Email verified. Redirecting you now.");
      await new Promise((resolve) => setTimeout(resolve, REDIRECT_DELAY_MS));
      window.location.href = "/model-setup";
    } catch {
      showError("Unable to reach the server. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }
  async function handleResendCode(event) {
    event.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");

    if (!email) {
      showError("Missing email address. Please return to signup.");
      return;
    }

    clearMessages();
    setIsResending(true);

    try{
      const response = await resendOTP({email});

      if (!response.ok){
        showError(response.data?.detail || "Could not resend code.");
        return;
      }

      setCode("")
      showSuccess(response.data?.message || "A new verification code was sent.")
    }catch{
      showError("Unable to reach the server. Please try again.")
    } finally{
      setIsResending(false)
    }
    
  }

  return (
    <Card className="sentinel-verify-card">
      <CardHeader>
        <div className="sentinel-verify-brand">
          <p className="sentinel-verify-name">SENTINEL</p>
          <p className="sentinel-verify-tagline">Market intelligence with AI</p>
        </div>
        <CardTitle className="sentinel-verify-title">Verify your email</CardTitle>
        <CardDescription className="sentinel-verify-description">
          Enter the one-time code sent to your email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <Alert className={`sentinel-verify-alert${isMessageFading ? " is-fading" : ""}`}>
              <AlertTitle>Check your code</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className={`sentinel-verify-success-alert${isMessageFading ? " is-fading" : ""}`}>
              <AlertTitle>Verification update</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <FieldGroup className="sentinel-verify-form-group">
            <Field className="sentinel-verify-code-field">
              <FieldLabel className="sentinel-verify-field" htmlFor="verificationCode">
                Verification Code
              </FieldLabel>
              <InputOTP
                id="verificationCode"
                name="verificationCode"
                maxLength={6}
                value={code}
                onChange={setCode}
                containerClassName="sentinel-verify-otp"
              >
                <InputOTPGroup>
                  <InputOTPSlot className="sentinel-verify-slot" index={0} />
                  <InputOTPSlot className="sentinel-verify-slot" index={1} />
                  <InputOTPSlot className="sentinel-verify-slot" index={2} />
                  <InputOTPSlot className="sentinel-verify-slot" index={3} />
                  <InputOTPSlot className="sentinel-verify-slot" index={4} />
                  <InputOTPSlot className="sentinel-verify-slot" index={5} />
                </InputOTPGroup>
              </InputOTP>
              <FieldDescription className="sentinel-verify-description-text">
                The code expires shortly. Check your inbox before requesting a new one.
              </FieldDescription>
            </Field>

            <Field>
              <Button className="sentinel-verify-primary" type="submit" disabled={isVerifying || isResending}>
                {isVerifying ? "Verifying..." : "Verify Email"}
              </Button>
              <Button className="sentinel-verify-secondary" variant="outline" type="button" onClick={handleResendCode} disabled={isVerifying || isResending}>
                {isResending ? "Sending..." : "Resend Code"}
              </Button>
              <FieldDescription className="sentinel-verify-description-text px-6 text-center">
                Used the wrong email?{" "}
                <a className="sentinel-verify-link" href="/">
                  Return to signup
                </a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
        <div className="sentinel-verify-signal">Identity check pending</div>
      </CardContent>
    </Card>
  );
}
