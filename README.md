# ZeroPass — Decentralized Identity & Verifiable Credentials Platform

ZeroPass is a production-grade decentralized identity and zero-knowledge verifiable credentials platform inspired by the W3C Verifiable Credentials Data Model v2.0 and the Privado ID / Iden3 ecosystem. It provides cryptographically enforced credential issuance, self-custodial wallet management with selective disclosure, and zero-knowledge proof verification.

---

## 1. System Architecture

ZeroPass implements the foundational **Issuer — Holder — Verifier** trust triangle with real cryptographic algorithms, role-based access control, and auditable on-chain accumulator mechanics:

```
                      ┌─────────────────────────────────┐
                      │          TRUST ANCHOR           │
                      │    Decentralized Trust Registry │
                      │  On-Chain State / Accumulator   │
                      └───────────────▲─────────────────┘
                                      │
            1. Anchors Public Key &   │  4. Queries Revocation Root &
               Revocation State Root  │     Verifies Issuer Signature
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
   ┌──────────┴──────────┐                         ┌──────────┴──────────┐
   │       ISSUER        │                         │      VERIFIER       │
   │ Organization Portal │                         │   Relying Party     │
   │ Ed25519 (EdDSA) VCs │                         │ Multi-Step Engine   │
   └──────────┬──────────┘                         └──────────▲──────────┘
              │                                               │
              │ 2. Issues Signed W3C VC                       │ 3. Presents Verifiable
              │    to Holder's DID                            │    Presentation (VP)
              │    (JWT VC with JWS Proof)                    │    with Nonce & ZK Proofs
              ▼                                               │
   ┌──────────────────────────────────────────────────────────┴──────────┐
   │                               HOLDER                                │
   │                   Self-Custodial Digital Wallet                     │
   │             Selective Disclosure & Zero-Knowledge Proofs             │
   └─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Cryptographic Implementation Details

* **Credential Format**: W3C Verifiable Credentials Data Model 2.0 represented as JSON Web Tokens (`typ: "JWT"` / `alg: "EdDSA"`).
* **Key Derivation & Algorithms**:
  * **Digital Signatures**: Edwards-curve Digital Signature Algorithm (Ed25519) via the maintained `jose` library.
  * **Presentation Replay Protection**: Verifiable Presentations (VPs) are bound to the verifier's DID (`aud`), a unique session challenge (`nonce`), and a short expiration interval (`exp: 10m`).
  * **Revocation Registry**: Dynamic cryptographic accumulator (`RevocationAccumulator`) maintaining a compressed state root. Revocations update the accumulator root in real time without leaking credential subjects.
  * **Predicate & Age Calculations**: Calendar-exact birthdate derivation accounting for leap years, calendar months, and exact day boundaries before evaluating zero-knowledge predicates (`gte`, `gt`, `lte`, `lt`, `eq`, `in`).
  * **Data Minimization (Selective Disclosure)**: Verifiers only receive claims explicitly permitted by the holder and required by the verification policy. Confidential unrequested claims are strictly withheld.

---

## 3. Implemented vs External-Dependent Features

To maintain strict cryptographic and architectural truthfulness, ZeroPass explicitly distinguishes between directly implemented features and features requiring external authority approval:

| Feature Area | Component | Implementation Status | Notes / External Dependencies |
| :--- | :--- | :--- | :--- |
| **Authentication & RBAC** | JWT Auth & Strict Middleware | **Fully Implemented** | Role-based enforcement (`ISSUER`, `HOLDER`, `VERIFIER`, `ADMIN`), bcrypt password hashing, DID generation. |
| **Credential Issuance** | Ed25519 W3C VC Signing | **Fully Implemented** | Real EdDSA JWS signature generation with JOSE standard compliance, schema validation, and DID binding. |
| **Holder Wallet** | Selective Disclosure & VPs | **Fully Implemented** | Interactive claim toggling, ZK predicate generation, replay-resistant presentation token signing. |
| **Verification Engine** | 6-Step Cryptographic Pipeline | **Fully Implemented** | Validates signature integrity, expiration timestamps, revocation accumulator root, issuer accreditation, and ZK predicates. |
| **Centralized Errors** | RFC 7807 Problem Details | **Fully Implemented** | Structured error codes, sanitized messages, and automated PII redaction in logs. |
| **Storage & Persistence** | Atomic Database Repository | **Fully Implemented** | Zero-dependency JSON storage engine with production-ready PostgreSQL (`docker-compose.yml`) & Prisma schema. |
| **DigiLocker Integration** | MeitY API Setu Gateway | **Specification & Guarded Provider** | Requires government department accreditation and Client Secret from MeitY (API Setu). Gateway returns descriptive setup checklist when credentials are unconfigured. |
| **Blockchain Anchor** | Polygon Amoy / Sepolia Registry | **Specification & Contract Ready** | Includes Solidity `ZeroPassRevocationRegistry.sol` smart contract and RPC provider bindings. Requires funded gas private key (`BLOCKCHAIN_PRIVATE_KEY`). |

---

## 4. REST API Reference

All protected endpoints enforce HTTP Bearer authentication: `Authorization: Bearer <token>`.

### Authentication & Persona
- `POST /api/auth/register` — Register a new identity with role and generated DID.
- `POST /api/auth/login` — Authenticate with email/password; returns 24h Bearer JWT.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `POST /api/auth/switch-persona` — Development switch between seed personas (`ISSUER`, `HOLDER`, `VERIFIER`, `ADMIN`).

### Credential Issuance & Management
- `GET /api/credentials` — List credentials with strict RBAC and cross-user data isolation.
- `GET /api/credentials/:id` — Inspect credential details (holder, issuer, or admin only).
- `POST /api/credentials/issue` — Issue an Ed25519-signed W3C Verifiable Credential (`ISSUER` or `ADMIN` required).
- `POST /api/credentials/:id/revoke` — Revoke credential and update cryptographic accumulator root.

### Schema Registry & Trust Directory
- `GET /api/schemas` — List credential schemas with attribute types and validation rules.
- `POST /api/schemas` — Register a new credential schema (`ADMIN` or `ISSUER`).
- `GET /api/issuers` — Directory of accredited institutions and verification methods.
- `GET /api/issuers/:did` — Trust profile and JWK public keys for an issuer.

### Verifier Sessions & Proof Pipeline
- `POST /api/verification-requests` — Initialize a verification session and generate QR deep link.
- `GET /api/verification-requests/:id` — Poll verification session status.
- `POST /api/presentations` — Holder signs Verifiable Presentation bound to session challenge.
- `POST /api/verifications` — Server executes 6-step cryptographic verification pipeline.

### Developer API & External Providers
- `GET /api/developer/keys` — List scoped API keys.
- `POST /api/developer/keys` — Generate a new scoped API key (`zp_live_...`).
- `DELETE /api/developer/keys/:id` — Revoke an API key.
- `GET /api/developer/logs` — Query auditable verification logs.
- `GET /api/providers/digilocker/status` — Inspect MeitY DigiLocker government onboarding checklist.
- `GET /api/blockchain/status` — Inspect smart contract revocation registry status.

---

## 5. Local Development & Testing Instructions

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Run Local Full-Stack Service
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (backend integration + frontend circuits)
npx --yes tsx --test server/server.test.ts src/utils/zkEngine.test.ts

# 3. Start development server (Express backend + Vite frontend on port 3000)
npm run dev
```

### PostgreSQL Local Deployment (Optional Production Parity)
```bash
# Start local PostgreSQL database container
docker compose up -d

# Push Prisma schema to local PostgreSQL instance
npx prisma db push
```

---

## 6. Default Seed Personas for Testing

| Persona / Role | Email | Password | DID |
| :--- | :--- | :--- | :--- |
| **Issuer (Registrar)** | `registrar@helios-polytechnic.edu.test` | `ZeroPass#2026!Demo` | `did:zeropass:testnet:helios:reg78912` |
| **Holder (Student/Citizen)** | `elena.rostova@zeropass.local` | `ZeroPass#2026!Demo` | `did:zeropass:testnet:holder:elena99321` |
| **Verifier (Compliance Officer)** | `compliance@meridian-audit.corp.test` | `ZeroPass#2026!Demo` | `did:zeropass:testnet:verifier:meridian441` |
| **Platform Administrator** | `admin@zeropass.network` | `ZeroPass#2026!Demo` | `did:zeropass:testnet:admin:root001` |
