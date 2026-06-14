import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()


def send_verification_email(to_email: str, code: str) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    email_fallback_to_console = os.getenv("EMAIL_FALLBACK_TO_CONSOLE", "true").lower() == "true"

    if not smtp_host:
        print(f"Verification code for {to_email}: {code}")
        return

    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    if smtp_password:
        smtp_password = smtp_password.replace(" ", "").strip()
    from_email = os.getenv("SMTP_FROM_EMAIL", smtp_username)

    if not from_email:
        raise RuntimeError("SMTP_FROM_EMAIL or SMTP_USERNAME must be set.")

    message = EmailMessage()
    message["Subject"] = "Your Sentinel verification code"
    message["From"] = from_email
    message["To"] = to_email
    message.set_content(
        f"Sentinel verification code\n\n"
        f"Your code is {code}.\n\n"
        "This code will expire soon. If you did not request this, you can ignore this email.\n\n"
        "Watching the market with you,\n"
        "Sentinel"
    )
    message.add_alternative(
        f"""\
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#050816;font-family:Arial,sans-serif;color:#f8fafc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050816;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#08101f;border:1px solid rgba(148,163,184,0.22);border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 18px;text-align:center;">
                <div style="display:inline-block;width:46px;height:46px;line-height:46px;border-radius:14px;background:linear-gradient(135deg,#4f46e5,#2563eb);color:#ffffff;font-size:24px;font-weight:800;">$</div>
                <h1 style="margin:16px 0 4px;font-size:22px;line-height:1.25;color:#f8fafc;">SENTINEL</h1>
                <p style="margin:0;color:#94a3b8;font-size:13px;">Market intelligence with AI</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;">
                <p style="margin:0 0 14px;color:#dbeafe;font-size:15px;line-height:1.5;">Use this one-time code to verify your email address.</p>
                <div style="margin:18px 0;padding:18px;border-radius:12px;background:#111827;border:1px solid rgba(167,139,250,0.34);text-align:center;">
                  <div style="color:#a78bfa;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Verification Code</div>
                  <div style="margin-top:8px;color:#f8fafc;font-size:34px;font-weight:800;letter-spacing:0.18em;">{code}</div>
                </div>
                <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">This code expires shortly. If you did not request this, you can ignore this email.</p>
                <p style="margin:22px 0 0;color:#dbeafe;font-size:14px;line-height:1.5;">Watching the market with you,<br><strong>Sentinel</strong></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""",
        subtype="html",
    )

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as smtp:
            smtp.starttls()

            if smtp_username and smtp_password:
                smtp.login(smtp_username, smtp_password)

            smtp.send_message(message)
    except smtplib.SMTPException as error:
        if not email_fallback_to_console:
            raise

        print(f"Could not send verification email to {to_email}: {error}")
        print(f"Verification code for {to_email}: {code}")
