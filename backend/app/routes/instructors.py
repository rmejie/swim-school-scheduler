"""REST endpoints for instructor management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Instructor
from app.schemas import InstructorCreate, InstructorResponse
from app.crypto import encrypt_field, decrypt_field

router = APIRouter(prefix="/api/instructors", tags=["instructors"])


@router.post("", response_model=InstructorResponse, status_code=201)
def create_instructor(data: InstructorCreate, db: Session = Depends(get_db)):
    row = Instructor(name_encrypted=encrypt_field(data.name))
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_response(row)


@router.get("", response_model=list[InstructorResponse])
def list_instructors(db: Session = Depends(get_db)):
    rows = db.query(Instructor).order_by(Instructor.id).all()
    return [_to_response(r) for r in rows]


@router.get("/{instructor_id}", response_model=InstructorResponse)
def get_instructor(instructor_id: int, db: Session = Depends(get_db)):
    row = db.query(Instructor).filter(Instructor.id == instructor_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Instructor not found")
    return _to_response(row)


@router.delete("/{instructor_id}", status_code=204)
def delete_instructor(instructor_id: int, db: Session = Depends(get_db)):
    row = db.query(Instructor).filter(Instructor.id == instructor_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Instructor not found")
    db.delete(row)
    db.commit()


def _to_response(row: Instructor) -> dict:
    return {
        "id": row.id,
        "name": decrypt_field(row.name_encrypted),
        "created_at": row.created_at,
    }
