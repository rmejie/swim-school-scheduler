"""Tests for the field-level encryption module."""

import os
import pytest
from app.crypto import (
    generate_keys,
    encrypt_field,
    decrypt_field,
    get_dek,
    reset_dek,
    PRIVATE_KEY_PATH,
    PUBLIC_KEY_PATH,
    WRAPPED_DEK_PATH,
)


class TestKeyGeneration:
    def test_generate_keys_creates_files(self):
        generate_keys()
        assert os.path.exists(PRIVATE_KEY_PATH)
        assert os.path.exists(PUBLIC_KEY_PATH)
        assert os.path.exists(WRAPPED_DEK_PATH)

    def test_generate_keys_returns_bytes(self):
        dek = generate_keys()
        assert isinstance(dek, bytes)
        assert len(dek) == 32

    def test_get_dek_generates_when_missing(self):
        dek = get_dek()
        assert isinstance(dek, bytes)
        assert len(dek) == 32

    def test_get_dek_cached(self):
        dek1 = get_dek()
        dek2 = get_dek()
        assert dek1 is dek2

    def test_reset_dek_clears_cache(self):
        dek1 = get_dek()
        reset_dek()
        dek2 = get_dek()
        assert dek1 == dek2  # same underlying key, re-unwrapped


class TestEncryptDecrypt:
    def test_roundtrip(self):
        plaintext = "Jane Doe"
        ct = encrypt_field(plaintext)
        assert ct != plaintext
        assert decrypt_field(ct) == plaintext

    def test_empty_string(self):
        assert encrypt_field("") == ""
        assert decrypt_field("") == ""

    def test_unicode(self):
        text = "Eñe Ñoño 你好"
        assert decrypt_field(encrypt_field(text)) == text

    def test_long_text(self):
        text = "A" * 10_000
        assert decrypt_field(encrypt_field(text)) == text

    def test_different_ciphertexts_for_same_plaintext(self):
        ct1 = encrypt_field("test")
        ct2 = encrypt_field("test")
        assert ct1 != ct2  # random nonce

    def test_tampered_ciphertext_fails(self):
        ct = encrypt_field("secret")
        tampered = ct[:-2] + ("AA" if ct[-2:] != "AA" else "BB")
        with pytest.raises(Exception):
            decrypt_field(tampered)

    def test_invalid_base64_fails(self):
        with pytest.raises(Exception):
            decrypt_field("not-valid-base64!!!")
