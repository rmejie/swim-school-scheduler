"""Tests for the client API endpoints."""

import pytest


class TestCreateClient:
    def test_create_success(self, client):
        res = client.post("/api/clients", json={
            "name": "Alice Smith",
            "email": "alice@example.com",
            "phone": "555-1234",
        })
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "Alice Smith"
        assert data["email"] == "alice@example.com"
        assert data["phone"] == "555-1234"

    def test_create_without_phone(self, client):
        res = client.post("/api/clients", json={
            "name": "Bob Jones",
            "email": "bob@example.com",
        })
        assert res.status_code == 201
        assert res.json()["phone"] == ""

    def test_create_name_too_short(self, client):
        res = client.post("/api/clients", json={"name": "A", "email": "a@b.com"})
        assert res.status_code == 422

    def test_create_invalid_email(self, client):
        res = client.post("/api/clients", json={"name": "Test", "email": "not-email"})
        assert res.status_code == 422

    def test_create_missing_email(self, client):
        res = client.post("/api/clients", json={"name": "Test"})
        assert res.status_code == 422


class TestListClients:
    def test_empty_list(self, client):
        res = client.get("/api/clients")
        assert res.status_code == 200
        assert res.json() == []

    def test_returns_decrypted_data(self, client):
        client.post("/api/clients", json={
            "name": "Carol White",
            "email": "carol@test.com",
            "phone": "555-9876",
        })
        res = client.get("/api/clients")
        data = res.json()
        assert len(data) == 1
        assert data[0]["name"] == "Carol White"
        assert data[0]["email"] == "carol@test.com"
        assert data[0]["phone"] == "555-9876"


class TestGetClient:
    def test_get_by_id(self, client):
        create_res = client.post("/api/clients", json={
            "name": "Dave Brown",
            "email": "dave@test.com",
        })
        cid = create_res.json()["id"]
        res = client.get(f"/api/clients/{cid}")
        assert res.status_code == 200
        assert res.json()["name"] == "Dave Brown"

    def test_get_not_found(self, client):
        res = client.get("/api/clients/9999")
        assert res.status_code == 404


class TestDeleteClient:
    def test_delete_success(self, client):
        create_res = client.post("/api/clients", json={
            "name": "To Delete",
            "email": "del@test.com",
        })
        cid = create_res.json()["id"]
        res = client.delete(f"/api/clients/{cid}")
        assert res.status_code == 204

    def test_delete_not_found(self, client):
        res = client.delete("/api/clients/9999")
        assert res.status_code == 404


class TestEncryptionVerification:
    def test_fields_stored_encrypted(self, client, db_session):
        client.post("/api/clients", json={
            "name": "Encrypted User",
            "email": "enc@secret.com",
            "phone": "555-0000",
        })
        from app.models import Client
        row = db_session.query(Client).first()
        assert row.name_encrypted != "Encrypted User"
        assert row.email_encrypted != "enc@secret.com"
        assert row.phone_encrypted != "555-0000"
