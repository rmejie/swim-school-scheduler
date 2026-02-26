"""Tests for the instructor API endpoints."""

import pytest


class TestCreateInstructor:
    def test_create_success(self, client):
        res = client.post("/api/instructors", json={"name": "Jane Doe"})
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "Jane Doe"
        assert "id" in data
        assert "created_at" in data

    def test_create_name_too_short(self, client):
        res = client.post("/api/instructors", json={"name": "A"})
        assert res.status_code == 422

    def test_create_name_missing(self, client):
        res = client.post("/api/instructors", json={})
        assert res.status_code == 422

    def test_create_multiple(self, client):
        client.post("/api/instructors", json={"name": "Jane Doe"})
        client.post("/api/instructors", json={"name": "John Smith"})
        res = client.get("/api/instructors")
        assert len(res.json()) == 2


class TestListInstructors:
    def test_empty_list(self, client):
        res = client.get("/api/instructors")
        assert res.status_code == 200
        assert res.json() == []

    def test_returns_decrypted_names(self, client):
        client.post("/api/instructors", json={"name": "Sarah Connor"})
        res = client.get("/api/instructors")
        data = res.json()
        assert len(data) == 1
        assert data[0]["name"] == "Sarah Connor"


class TestGetInstructor:
    def test_get_by_id(self, client):
        create_res = client.post("/api/instructors", json={"name": "Mike Chen"})
        inst_id = create_res.json()["id"]
        res = client.get(f"/api/instructors/{inst_id}")
        assert res.status_code == 200
        assert res.json()["name"] == "Mike Chen"

    def test_get_not_found(self, client):
        res = client.get("/api/instructors/9999")
        assert res.status_code == 404


class TestDeleteInstructor:
    def test_delete_success(self, client):
        create_res = client.post("/api/instructors", json={"name": "To Delete"})
        inst_id = create_res.json()["id"]
        res = client.delete(f"/api/instructors/{inst_id}")
        assert res.status_code == 204
        assert client.get(f"/api/instructors/{inst_id}").status_code == 404

    def test_delete_not_found(self, client):
        res = client.delete("/api/instructors/9999")
        assert res.status_code == 404


class TestEncryptionVerification:
    def test_name_stored_encrypted(self, client, db_session):
        client.post("/api/instructors", json={"name": "Secret Name"})
        from app.models import Instructor
        row = db_session.query(Instructor).first()
        assert row.name_encrypted != "Secret Name"
        assert len(row.name_encrypted) > 20  # base64 ciphertext
