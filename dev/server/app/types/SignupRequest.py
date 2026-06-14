from pydantic import BaseModel, EmailStr

class SignupRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str