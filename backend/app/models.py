"""
SQLAlchemy ORM models for the swim school scheduler.

All PII fields (names, emails, phones) are stored encrypted.
The encrypted columns store base64-encoded AES-GCM ciphertext.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Text, String, DateTime
from app.database import Base


class Instructor(Base):
    __tablename__ = "instructors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name_encrypted = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name_encrypted = Column(Text, nullable=False)
    email_encrypted = Column(Text, nullable=False)
    phone_encrypted = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    instructor_id = Column(Integer, nullable=False)
    instructor_name_encrypted = Column(Text, nullable=False)
    client_id = Column(Integer, nullable=False)
    client_name_encrypted = Column(Text, nullable=False)
    date = Column(String(10), nullable=False)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    appointment_type = Column(String(20), nullable=False, default="individual")
    blocks = Column(Text, nullable=True)
    recurring_id = Column(String(50), nullable=True)
    status = Column(String(20), nullable=False, default="scheduled")
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
