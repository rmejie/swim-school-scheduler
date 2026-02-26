"""
Shared pytest fixtures for the swim school scheduler backend tests.

Creates a fresh in-memory SQLite database and test client for each test,
and generates temporary encryption keys so tests are fully isolated.
"""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  – ensure models are registered on Base
from app.database import Base, get_db
from app.main import app
from app import crypto


@pytest.fixture(autouse=True)
def _isolated_keys(tmp_path):
    """Point the crypto module at a temporary keys directory for every test."""
    keys_dir = str(tmp_path / "keys")
    os.makedirs(keys_dir, exist_ok=True)

    crypto.KEYS_DIR = keys_dir
    crypto.PRIVATE_KEY_PATH = os.path.join(keys_dir, "ecc_private.pem")
    crypto.PUBLIC_KEY_PATH = os.path.join(keys_dir, "ecc_public.pem")
    crypto.WRAPPED_DEK_PATH = os.path.join(keys_dir, "wrapped_dek.bin")
    crypto.reset_dek()

    yield

    crypto.reset_dek()


@pytest.fixture()
def db_session():
    """Yield a SQLAlchemy session backed by an in-memory SQLite DB."""
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def client(db_session):
    """Return a FastAPI TestClient wired to the in-memory DB."""
    def _override_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
