"""REST endpoints for client management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Client
from app.schemas import ClientCreate, ClientResponse
from app.crypto import encrypt_field, decrypt_field

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.post("", response_model=ClientResponse, status_code=201)
def create_client(data: ClientCreate, db: Session = Depends(get_db)):
    row = Client(
        name_encrypted=encrypt_field(data.name),
        email_encrypted=encrypt_field(data.email),
        phone_encrypted=encrypt_field(data.phone) if data.phone else None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_response(row)


@router.get("", response_model=list[ClientResponse])
def list_clients(db: Session = Depends(get_db)):
    rows = db.query(Client).order_by(Client.id).all()
    return [_to_response(r) for r in rows]


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, db: Session = Depends(get_db)):
    row = db.query(Client).filter(Client.id == client_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Client not found")
    return _to_response(row)


@router.delete("/{client_id}", status_code=204)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    row = db.query(Client).filter(Client.id == client_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(row)
    db.commit()


def _to_response(row: Client) -> dict:
    return {
        "id": row.id,
        "name": decrypt_field(row.name_encrypted),
        "email": decrypt_field(row.email_encrypted),
        "phone": decrypt_field(row.phone_encrypted) if row.phone_encrypted else "",
        "created_at": row.created_at,
    }
