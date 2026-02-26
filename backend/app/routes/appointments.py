"""REST endpoints for appointment scheduling with block-based conflict detection."""

import json
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Appointment
from app.schemas import AppointmentCreate, AppointmentResponse, RecurringCreate
from app.crypto import encrypt_field, decrypt_field

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

BLOCK_MINUTES = 20


def _get_blocks(start_time: str, block_count: int) -> list[str]:
    """Return the block start times occupied by an appointment."""
    h, m = map(int, start_time.split(":"))
    mins = h * 60 + m
    blocks = []
    for _ in range(block_count):
        bh, bm = divmod(mins % 1440, 60)
        blocks.append(f"{bh:02d}:{bm:02d}")
        mins += BLOCK_MINUTES
    return blocks


def _end_time(start_time: str, block_count: int) -> str:
    h, m = map(int, start_time.split(":"))
    total = h * 60 + m + block_count * BLOCK_MINUTES
    eh, em = divmod(total % 1440, 60)
    return f"{eh:02d}:{em:02d}"


def _check_conflict(existing: list[Appointment], requested_blocks: list[str]):
    """Raise 409 if any existing appointment overlaps the requested blocks."""
    for appt in existing:
        if appt.status == "cancelled":
            continue
        appt_blocks = json.loads(appt.blocks) if appt.blocks else []
        if set(requested_blocks) & set(appt_blocks):
            raise HTTPException(status_code=409, detail="Double booking: time conflict with existing appointment")


@router.post("", response_model=AppointmentResponse, status_code=201)
def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db)):
    requested_blocks = _get_blocks(data.start_time, data.block_count)

    existing = (
        db.query(Appointment)
        .filter(Appointment.instructor_id == data.instructor_id, Appointment.date == data.date)
        .all()
    )
    _check_conflict(existing, requested_blocks)

    row = Appointment(
        instructor_id=data.instructor_id,
        instructor_name_encrypted=encrypt_field(data.instructor_name),
        client_id=data.client_id,
        client_name_encrypted=encrypt_field(data.client_name),
        date=data.date,
        start_time=data.start_time,
        end_time=_end_time(data.start_time, data.block_count),
        appointment_type=data.appointment_type,
        blocks=json.dumps(requested_blocks),
        status="scheduled",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_response(row)


@router.get("", response_model=list[AppointmentResponse])
def list_appointments(
    date: str | None = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    instructor_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Appointment)
    if date:
        q = q.filter(Appointment.date == date)
    if instructor_id is not None:
        q = q.filter(Appointment.instructor_id == instructor_id)
    rows = q.order_by(Appointment.date, Appointment.start_time).all()
    return [_to_response(r) for r in rows]


@router.patch("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(appointment_id: int, db: Session = Depends(get_db)):
    row = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if row.status == "cancelled":
        raise HTTPException(status_code=400, detail="Appointment already cancelled")
    row.status = "cancelled"
    db.commit()
    db.refresh(row)
    return _to_response(row)


@router.post("/recurring", response_model=list[AppointmentResponse], status_code=201)
def create_recurring(data: RecurringCreate, db: Session = Depends(get_db)):
    results = []
    current_date = datetime.strptime(data.start_date, "%Y-%m-%d")
    recurring_id = str(uuid.uuid4())

    for _ in range(data.occurrences):
        date_str = current_date.strftime("%Y-%m-%d")
        requested_blocks = _get_blocks(data.start_time, data.block_count)

        existing = (
            db.query(Appointment)
            .filter(Appointment.instructor_id == data.instructor_id, Appointment.date == date_str)
            .all()
        )
        _check_conflict(existing, requested_blocks)

        row = Appointment(
            instructor_id=data.instructor_id,
            instructor_name_encrypted=encrypt_field(data.instructor_name),
            client_id=data.client_id,
            client_name_encrypted=encrypt_field(data.client_name),
            date=date_str,
            start_time=data.start_time,
            end_time=_end_time(data.start_time, data.block_count),
            appointment_type=data.appointment_type,
            blocks=json.dumps(requested_blocks),
            recurring_id=recurring_id,
            status="scheduled",
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        results.append(_to_response(row))
        current_date += timedelta(weeks=1)

    return results


def _to_response(row: Appointment) -> dict:
    return {
        "id": row.id,
        "instructor_id": row.instructor_id,
        "instructor_name": decrypt_field(row.instructor_name_encrypted),
        "client_id": row.client_id,
        "client_name": decrypt_field(row.client_name_encrypted),
        "date": row.date,
        "start_time": row.start_time,
        "end_time": row.end_time,
        "appointment_type": row.appointment_type,
        "blocks": json.loads(row.blocks) if row.blocks else [],
        "recurring_id": row.recurring_id,
        "status": row.status,
        "created_at": row.created_at,
    }
