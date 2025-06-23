# CoopLedger: A Simulated Blockchain SACCO Platform

<p align="center">
  <img src="/public/icon.svg" alt="CoopLedger Logo" width="120">
</p>

<h1 align="center">CoopLedger</h1>

<p align="center">
  Transparent and secure savings and micro-loans for communities, built on modern web technologies with a simulated blockchain backend.
</p>

---

## 🚀 Mission

CoopLedger aims to empower community savings groups (SACCOs), particularly focusing on rural youth and women, by providing a transparent, secure, and accessible financial platform. It leverages the principles of blockchain technology without the associated costs and complexities, making it suitable for low-bandwidth environments and users new to digital finance.

## ✨ Core Features

- **Group Wallets**: Create and manage shared wallets for collective savings goals.
- **Tokenized Contributions**: Members can contribute to group wallets using a stablecoin (`UGX`) or the native app token (`$CL`).
- **DAO-Style Loan System**: Propose, vote on, and manage micro-loans through a decentralized, member-driven approval process.
- **Transparent Records**: An immutable, hash-chained ledger provides a transparent and auditable record of all transactions (contributions, loans, repayments).
- **Member Verification (KYC)**: A secure, AI-powered identity verification process that hashes personal information on the user's device to protect privacy.
- **AI-Powered Credit Reputation**: An integrated AI tool analyzes a member's contribution and repayment history to generate a simple, dynamic credit score.
- **Admin Oversight**: A dedicated dashboard for administrators to manage members, oversee all wallets, and monitor system-wide activity.
- **Personal Wallets**: Each user has a personal wallet to manage their funds before contributing to a group.

## 🛠️ Technology Stack

CoopLedger is built with a modern, robust, and scalable technology stack:

- **Framework**: **Next.js** (App Router)
- **Language**: **TypeScript**
- **UI**: **React**, **ShadCN UI**, **Tailwind CSS**
- **AI & GenAI**: **Firebase Genkit** with **Google's Gemini** models for KYC and credit scoring.
- **Database & Backend**: **Firebase** (Firestore) for real-time data storage and backend logic.

### The Blockchain Simulation

A key innovation in CoopLedger is its **simulated blockchain ledger**, designed to provide the security benefits of a blockchain without the technical overhead or transaction fees ("gas").

Here’s how it works:
1.  **Immutable Ledger in Firestore**: All transactions are stored as documents in Firestore collections (`wallets` and `personal_ledger`).
2.  **Cryptographic Hashing**: Every transaction is cryptographically signed using a **SHA-256 hash**.
3.  **Hash Chaining**: Each new transaction includes the hash of the *previous* transaction in its data block. This creates a sequential, unbreakable chain. If a past transaction were altered, its hash would change, invalidating the entire chain that follows.
4.  **Genesis Block**: The very first transaction in any sequence references a `GENESIS_HASH` (a string of zeroes), starting the chain.

This approach makes the ledger **tamper-evident and transparent**, achieving core blockchain principles in a cost-effective and accessible way.

### DAO-Style Governance

The loan and fund withdrawal systems are governed by the members of each group wallet, mimicking a Decentralized Autonomous Organization (DAO).
- **Proposals**: Members can propose loans or withdrawals.
- **Voting**: All other members of that specific wallet can vote on the proposal. The proposal passes or fails based on a majority vote (e.g., >50%).
- **Atomic Execution**: Voting and the subsequent execution (e.g., loan disbursement) are handled within **Firestore Transactions**. This ensures that the entire operation either succeeds or fails together, preventing partial updates and maintaining data integrity.

---

## 🚀 Getting Started

### Prerequisites
- Node.js and npm installed.
- A Firebase project set up with Firestore enabled. Your Firebase configuration should be in a `.env.local` file.

### Running the Application
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
The application will be available at `http://localhost:9002`.

### Demo Access

A live version of the application is available for testing. You can create a new account here:
[https://coop-ledger.vercel.app/signup](https://coop-ledger.vercel.app/signup)

For local development, you can log in and test the application using the following pre-seeded user accounts.

**Password for all users:** `password2025`

| Name              | Role   | Phone Number     | Notes                                   |
| ----------------- | ------ | ---------------- | --------------------------------------- |
| **Fatima Diallo** | Admin  | `+256772000003`  | Can access the Admin Dashboard.         |
| **Aisha Ibrahim** | Member | `+256772000001`  | A verified member with transaction history. |
| **Nuwahereza Peter** | Member | `+256772000005` | A verified member.                       |
| **John Okello**   | Member | `+256772000002`  | A member with a pending verification.   |

You can also sign up as a new user through the "Sign up" link on the login page.
