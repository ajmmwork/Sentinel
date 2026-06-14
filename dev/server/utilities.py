import bcrypt
import hashlib
import secrets

def hash_password(password: str):
    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        raise ValueError("Password must be 72 bytes or fewer.")

    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password:str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )

def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"

def generate_session_token() -> str:
    return secrets.token_urlsafe(48)

def hash_session_token(session_token: str) -> str:
    return hashlib.sha256(session_token.encode("utf-8")).hexdigest()
