"""
Pydantic schemas for request/response validation.

These schemas define the API contract. Clients always send and receive
plaintext data; encryption/decryption happens in the route layer.
"""

from datetime import datetime
from pydantic import BaseModel, Field, field_validator
import re

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class InstructorCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class InstructorResponse(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ClientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., max_length=200)
    phone: str = Field(default="", max_length=30)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not EMAIL_RE.match(v):
            raise ValueError("Invalid email format")
        return v


class ClientResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AppointmentCreate(BaseModel):
    instructor_id: int
    instructor_name: str = ""
    client_id: int
    client_name: str = ""
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    block_count: int = Field(..., ge=1, le=3)
    appointment_type: str = Field(default="individual")


class AppointmentResponse(BaseModel):
    id: int
    instructor_id: int
    instructor_name: str
    client_id: int
    client_name: str
    date: str
    start_time: str
    end_time: str
    appointment_type: str
    blocks: list[str]
    recurring_id: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RecurringCreate(BaseModel):
    instructor_id: int
    instructor_name: str = ""
    client_id: int
    client_name: str = ""
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    block_count: int = Field(..., ge=1, le=3)
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    occurrences: int = Field(..., ge=1, le=12)
    appointment_type: str = Field(default="recurring")
