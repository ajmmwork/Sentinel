export function validatePassword(password, confirmPassword) {
  const value = password || "";
  let description = "";

  if (value.length < 8) {
    description += "Password must be 8 characters or more.\n";
  }

  if (new TextEncoder().encode(value).length > 72) {
    description += "Password must be 72 bytes or fewer.\n";
  }

  if (!/[A-Z]/.test(value)) {
    description += "Password must contain at least one capital letter.\n";
  }

  if (!/[a-z]/.test(value)) {
    description += "Password must contain at least one lowercase letter.\n";
  }

  if (!/[0-9]/.test(value)) {
    description += "Password must contain at least one number.\n";
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    description += "Password must contain at least one special character.\n";
  }

  if (password != confirmPassword){
    description += "Passwords do not match. Please re-enter your password confirmation."

  }

  return description;
}
