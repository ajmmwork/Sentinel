from datetime import datetime, timedelta


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.types.SignupRequest import SignupRequest
from app.types.VerifyEmailRequest import VerifyEmailRequest
from app.types.LoginRequest import LoginRequest
from app.types.ResendCodeRequest import ResendCodeRequest
from app.services.email import send_verification_email
from app.db.models.user import User
from app.db.models.pending_signup import PendingSignup
from app.db.models.user_session import UserSession
from utilities import (
    generate_otp,
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_password,
)

router = APIRouter()

def create_user_session(user: User, db: Session) -> str:
    session_token = generate_session_token()
    session = UserSession(
        user_id=user.user_id,
        session_token_hash=hash_session_token(session_token),
        expires_on=datetime.now() + timedelta(days=30),
        last_used_on=datetime.now(),
    )

    db.add(session)
    db.commit()

    return session_token

@router.post("/signup", status_code=status.HTTP_200_OK)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    first_name = payload.firstName
    last_name = payload.lastName
    password = payload.password
    email = payload.email

    if not (first_name and last_name and password and email) : 
        raise HTTPException(
            status_code = 400,
            detail="First name, last name, email, and password are required.",
        )

    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password must be 72 bytes or fewer.",
        )
    
    existing_user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if existing_user :
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    existing_pending_user = (
        db.query(PendingSignup)
        .filter(PendingSignup.email == email)
        .first()
    )
    
    code = generate_otp()
    expires_on = datetime.now() + timedelta(minutes=5)

    if existing_pending_user:
        existing_pending_user.first_name = first_name
        existing_pending_user.last_name = last_name
        existing_pending_user.password_hash = hash_password(password)
        existing_pending_user.verification_code_hash = hash_password(code)
        existing_pending_user.created_on = datetime.now()
        existing_pending_user.expires_on = expires_on
        pending_user = existing_pending_user
    else:
        pending_user = PendingSignup(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=hash_password(password),
            verification_code_hash=hash_password(code),
            expires_on=expires_on,
        )

        db.add(pending_user)

    db.commit()
    db.refresh(pending_user)

    send_verification_email(email, code)

    return {"message": "Verification code sent."}
    
@router.post("/login", status_code=status.HTTP_200_OK)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email
    password = payload.password

    if not (email and password):
        raise HTTPException(
            status_code=400,
            detail="Email and password are required.",
        )

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not existing_user or not verify_password(password, existing_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    session_token = create_user_session(existing_user, db)

    return {
        "message": "Login successful.",
        "session_token": session_token,
    }
    
@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    email = payload.email
    code = payload.code

    if not (email and code):
        raise HTTPException(
            status_code=400,
            detail="Email and verification code are required.",
        )

    pending_user = (
        db.query(PendingSignup)
        .filter(PendingSignup.email == email)
        .first()
    )

    if not pending_user:
        raise HTTPException(
            status_code=404,
            detail="No pending signup found for this email.",
        )

    if pending_user.expires_on < datetime.now():
        db.delete(pending_user)
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please sign up again.",
        )

    if not verify_password(code, pending_user.verification_code_hash):
        raise HTTPException(
            status_code=400,
            detail="Verification code is invalid.",
        )

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        db.delete(pending_user)
        db.commit()
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    user = User(
        first_name=pending_user.first_name,
        last_name=pending_user.last_name,
        email=pending_user.email,
        password_hash=pending_user.password_hash,
    )

    db.add(user)
    db.delete(pending_user)
    db.commit()
    db.refresh(user)

    session_token = create_user_session(user, db)

    return {
        "message": "Email verified.",
        "session_token": session_token,
    }

@router.post("/resend-code", status_code=status.HTTP_200_OK)
def resend_code(payload: ResendCodeRequest, db: Session = Depends(get_db)):
    email = payload.email

    existing_pending_signup = (
        db.query(PendingSignup)
        .filter(PendingSignup.email == email)
        .first()
    )

    if not existing_pending_signup:
        raise HTTPException(
            status_code=404,
            detail="No pending signup found for this email. Please sign up first."
        )
    code = generate_otp()
    existing_pending_signup.verification_code_hash = hash_password(code)
    existing_pending_signup.created_on = datetime.now()
    existing_pending_signup.expires_on = datetime.now() + timedelta(minutes=5)
    db.commit()
    send_verification_email(email, code)
    return {
        "message" : "Successful resend code request"
    }


