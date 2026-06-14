from datetime import datetime

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.db.models.user_session import UserSession
from app.db.session import get_db
from utilities import hash_session_token


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid session.",
        )

    session_token = authorization.removeprefix("Bearer ").strip()
    session_token_hash = hash_session_token(session_token)

    user_session = (
        db.query(UserSession)
        .filter(
            UserSession.session_token_hash == session_token_hash,
            UserSession.is_active == True,
            UserSession.expires_on > datetime.now(),
        )
        .first()
    )

    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
        )

    current_user = (
        db.query(User)
        .filter(User.user_id == user_session.user_id)
        .first()
    )

    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session user no longer exists.",
        )

    user_session.last_used_on = datetime.now()
    db.commit()

    return current_user
