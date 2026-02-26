"""Tests for the appointment API endpoints."""

import pytest


def _create_instructor(client, name="Test Instructor"):
    res = client.post("/api/instructors", json={"name": name})
    return res.json()["id"]


def _create_client(client, name="Test Student", email="test@example.com"):
    res = client.post("/api/clients", json={"name": name, "email": email})
    return res.json()["id"]


class TestCreateAppointment:
    def test_create_success(self, client):
        inst_id = _create_instructor(client)
        clt_id = _create_client(client)
        res = client.post("/api/appointments", json={
            "instructor_id": inst_id,
            "instructor_name": "Test Instructor",
            "client_id": clt_id,
            "client_name": "Test Student",
            "date": "2026-07-01",
            "start_time": "10:00",
            "block_count": 1,
        })
        assert res.status_code == 201
        data = res.json()
        assert data["start_time"] == "10:00"
        assert data["end_time"] == "10:20"
        assert data["blocks"] == ["10:00"]
        assert data["status"] == "scheduled"

    def test_create_multi_block(self, client):
        inst_id = _create_instructor(client)
        clt_id = _create_client(client)
        res = client.post("/api/appointments", json={
            "instructor_id": inst_id,
            "client_id": clt_id,
            "date": "2026-07-01",
            "start_time": "14:00",
            "block_count": 3,
        })
        data = res.json()
        assert data["end_time"] == "15:00"
        assert data["blocks"] == ["14:00", "14:20", "14:40"]

    def test_double_booking_rejected(self, client):
        inst_id = _create_instructor(client)
        clt_id = _create_client(client)
        client.post("/api/appointments", json={
            "instructor_id": inst_id,
            "client_id": clt_id,
            "date": "2026-07-01",
            "start_time": "10:00",
            "block_count": 2,
        })
        res = client.post("/api/appointments", json={
            "instructor_id": inst_id,
            "client_id": clt_id,
            "date": "2026-07-01",
            "start_time": "10:00",
            "block_count": 1,
        })
        assert res.status_code == 409
        assert "Double booking" in res.json()["detail"]

    def test_back_to_back_allowed(self, client):
        inst_id = _create_instructor(client)
        clt_id = _create_client(client)
        client.post("/api/appointments", json={
            "instructor_id": inst_id,
            "client_id": clt_id,
            "date": "2026-07-01",
            "start_time": "10:00",
            "block_count": 1,
        })
        res = client.post("/api/appointments", json={
            "instructor_id": inst_id,
            "client_id": clt_id,
            "date": "2026-07-01",
            "start_time": "10:20",
            "block_count": 1,
        })
        assert res.status_code == 201

    def test_different_instructors_same_time(self, client):
        inst1 = _create_instructor(client, "Inst A")
        inst2 = _create_instructor(client, "Inst B")
        clt_id = _create_client(client)
        client.post("/api/appointments", json={
            "instructor_id": inst1,
            "client_id": clt_id,
            "date": "2026-07-01",
            "start_time": "10:00",
            "block_count": 1,
        })
        res = client.post("/api/appointments", json={
            "instructor_id": inst2,
            "client_id": clt_id,
            "date": "2026-07-01",
            "start_time": "10:00",
            "block_count": 1,
        })
        assert res.status_code == 201

    def test_invalid_date_format(self, client):
        res = client.post("/api/appointments", json={
            "instructor_id": 1,
            "client_id": 1,
            "date": "07-01-2026",
            "start_time": "10:00",
            "block_count": 1,
        })
        assert res.status_code == 422


class TestListAppointments:
    def test_filter_by_date(self, client):
        inst_id = _create_instructor(client)
        clt_id = _create_client(client)
        client.post("/api/appointments", json={
            "instructor_id": inst_id, "client_id": clt_id,
            "date": "2026-07-01", "start_time": "10:00", "block_count": 1,
        })
        client.post("/api/appointments", json={
            "instructor_id": inst_id, "client_id": clt_id,
            "date": "2026-07-02", "start_time": "10:00", "block_count": 1,
        })
        res = client.get("/api/appointments?date=2026-07-01")
        assert len(res.json()) == 1
        assert res.json()[0]["date"] == "2026-07-01"

    def test_filter_by_instructor(self, client):
        inst1 = _create_instructor(client, "Inst A")
        inst2 = _create_instructor(client, "Inst B")
        clt_id = _create_client(client)
        client.post("/api/appointments", json={
            "instructor_id": inst1, "client_id": clt_id,
            "date": "2026-07-01", "start_time": "10:00", "block_count": 1,
        })
        client.post("/api/appointments", json={
            "instructor_id": inst2, "client_id": clt_id,
            "date": "2026-07-01", "start_time": "10:00", "block_count": 1,
        })
        res = client.get(f"/api/appointments?instructor_id={inst1}")
        assert len(res.json()) == 1

    def test_empty_list(self, client):
        res = client.get("/api/appointments?date=2026-01-01")
        assert res.status_code == 200
        assert res.json() == []


class TestCancelAppointment:
    def test_cancel_success(self, client):
        inst_id = _create_instructor(client)
        clt_id = _create_client(client)
        create_res = client.post("/api/appointments", json={
            "instructor_id": inst_id, "client_id": clt_id,
            "date": "2026-07-01", "start_time": "10:00", "block_count": 1,
        })
        appt_id = create_res.json()["id"]
        res = client.patch(f"/api/appointments/{appt_id}/cancel")
        assert res.status_code == 200
        assert res.json()["status"] == "cancelled"

    def test_cancel_already_cancelled(self, client):
        inst_id = _create_instructor(client)
        clt_id = _create_client(client)
        create_res = client.post("/api/appointments", json={
            "instructor_id": inst_id, "client_id": clt_id,
            "date": "2026-07-01", "start_time": "10:00", "block_count": 1,
        })
        appt_id = create_res.json()["id"]
        client.patch(f"/api/appointments/{appt_id}/cancel")
        res = client.patch(f"/api/appointments/{appt_id}/cancel")
        assert res.status_code == 400

    def test_cancel_not_found(self, client):
        res = client.patch("/api/appointments/9999/cancel")
        assert res.status_code == 404

    def test_cancelled_slot_available(self, client):
        """After cancelling, the same time slot should be bookable again."""
        inst_id = _create_instructor(client)
        clt_id = _create_client(client)
        create_res = client.post("/api/appointments", json={
            "instructor_id": inst_id, "client_id": clt_id,
            "date": "2026-07-01", "start_time": "10:00", "block_count": 1,
        })
        appt_id = create_res.json()["id"]
        client.patch(f"/api/appointments/{appt_id}/cancel")
        res = client.post("/api/appointments", json={
            "instructor_id": inst_id, "client_id": clt_id,
            "date": "2026-07-01", "start_time": "10:00", "block_count": 1,
        })
        assert res.status_code == 201


class TestRecurringAppointments:
    def test_create_recurring_series(self, client):
        inst_id = _create_instructor(client)
        clt_id = _create_client(client)
        res = client.post("/api/appointments/recurring", json={
            "instructor_id": inst_id,
            "client_id": clt_id,
            "start_time": "09:00",
            "block_count": 1,
            "start_date": "2026-07-01",
            "occurrences": 4,
        })
        assert res.status_code == 201
        data = res.json()
        assert len(data) == 4
        dates = [a["date"] for a in data]
        assert dates == ["2026-07-01", "2026-07-08", "2026-07-15", "2026-07-22"]
        assert all(a["recurring_id"] == data[0]["recurring_id"] for a in data)

    def test_recurring_conflict_stops(self, client):
        inst_id = _create_instructor(client)
        clt_id = _create_client(client)
        client.post("/api/appointments", json={
            "instructor_id": inst_id, "client_id": clt_id,
            "date": "2026-07-08", "start_time": "09:00", "block_count": 1,
        })
        res = client.post("/api/appointments/recurring", json={
            "instructor_id": inst_id,
            "client_id": clt_id,
            "start_time": "09:00",
            "block_count": 1,
            "start_date": "2026-07-01",
            "occurrences": 4,
        })
        assert res.status_code == 409
