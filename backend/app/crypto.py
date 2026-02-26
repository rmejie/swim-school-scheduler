"""
Field-level encryption for the swim school scheduler.

Uses an envelope encryption scheme:
  1. A random AES-256 Data Encryption Key (DEK) encrypts all sensitive fields
  2. The DEK itself is wrapped (encrypted) using an ECC P-256 key pair via ECIES
  3. At runtime the DEK is unwrapped with the private key and held in memory

Encrypted values are stored as base64(nonce ‖ ciphertext ‖ tag)  (12 + N + 16 bytes).
"""

import os
import base64
import hashlib

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

KEYS_DIR = os.path.join(os.path.dirname(__file__), "..", "keys")
PRIVATE_KEY_PATH = os.path.join(KEYS_DIR, "ecc_private.pem")
PUBLIC_KEY_PATH = os.path.join(KEYS_DIR, "ecc_public.pem")
WRAPPED_DEK_PATH = os.path.join(KEYS_DIR, "wrapped_dek.bin")

_dek: bytes | None = None


def _ensure_keys_dir():
    os.makedirs(KEYS_DIR, exist_ok=True)


def generate_keys():
    """Generate a fresh ECC key pair and a wrapped DEK.  Overwrites existing keys."""
    _ensure_keys_dir()

    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    with open(PRIVATE_KEY_PATH, "wb") as f:
        f.write(private_key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        ))

    with open(PUBLIC_KEY_PATH, "wb") as f:
        f.write(public_key.public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        ))

    dek = AESGCM.generate_key(bit_length=256)
    _wrap_dek(dek, public_key)
    return dek


def _wrap_dek(dek: bytes, public_key: ec.EllipticCurvePublicKey):
    """Wrap the DEK using ECIES: ECDH + HKDF -> AES-GCM."""
    ephemeral_private = ec.generate_private_key(ec.SECP256R1())
    ephemeral_public = ephemeral_private.public_key()

    shared_secret = ephemeral_private.exchange(ec.ECDH(), public_key)
    wrapping_key = HKDF(
        algorithm=hashes.SHA256(), length=32, salt=None, info=b"swim-school-dek-wrap",
    ).derive(shared_secret)

    aesgcm = AESGCM(wrapping_key)
    nonce = os.urandom(12)
    encrypted_dek = aesgcm.encrypt(nonce, dek, None)

    ephemeral_pub_bytes = ephemeral_public.public_bytes(
        serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    with open(WRAPPED_DEK_PATH, "wb") as f:
        f.write(len(ephemeral_pub_bytes).to_bytes(2, "big"))
        f.write(ephemeral_pub_bytes)
        f.write(nonce)
        f.write(encrypted_dek)


def _unwrap_dek() -> bytes:
    """Unwrap the DEK using the stored private key."""
    with open(PRIVATE_KEY_PATH, "rb") as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)

    with open(WRAPPED_DEK_PATH, "rb") as f:
        pub_len = int.from_bytes(f.read(2), "big")
        ephemeral_pub_bytes = f.read(pub_len)
        nonce = f.read(12)
        encrypted_dek = f.read()

    ephemeral_public = serialization.load_der_public_key(ephemeral_pub_bytes)
    shared_secret = private_key.exchange(ec.ECDH(), ephemeral_public)

    wrapping_key = HKDF(
        algorithm=hashes.SHA256(), length=32, salt=None, info=b"swim-school-dek-wrap",
    ).derive(shared_secret)

    aesgcm = AESGCM(wrapping_key)
    return aesgcm.decrypt(nonce, encrypted_dek, None)


def get_dek() -> bytes:
    """Return the DEK, unwrapping it on first call and caching in memory."""
    global _dek
    if _dek is None:
        if not os.path.exists(WRAPPED_DEK_PATH):
            _dek = generate_keys()
        else:
            _dek = _unwrap_dek()
    return _dek


def reset_dek():
    """Clear cached DEK (used by tests to force re-initialisation)."""
    global _dek
    _dek = None


def encrypt_field(plaintext: str) -> str:
    """Encrypt a plaintext string and return base64-encoded ciphertext."""
    if not plaintext:
        return ""
    dek = get_dek()
    aesgcm = AESGCM(dek)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ct).decode("ascii")


def decrypt_field(ciphertext: str) -> str:
    """Decrypt a base64-encoded ciphertext and return the plaintext string."""
    if not ciphertext:
        return ""
    dek = get_dek()
    raw = base64.b64decode(ciphertext)
    nonce, ct = raw[:12], raw[12:]
    aesgcm = AESGCM(dek)
    return aesgcm.decrypt(nonce, ct, None).decode("utf-8")
