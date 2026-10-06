# PhucHwa System

A blockchain-powered healthcare management platform designed to enhance transparency, security, and trust in healthcare service operations through smart contract integration and secure digital identity verification.

## Overview

PhucHwa System is a healthcare digital transformation platform that combines traditional backend services with Blockchain technology.

The platform supports healthcare contract management, nurse performance evaluation, dispute resolution, transaction processing, and secure identity verification through QR/NFC-based authentication mechanisms.

## Technologies

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Redis

### Blockchain

* Solidity
* Hardhat
* Web3.js
* Ethereum Sepolia Testnet

### Security

* JWT Authentication
* Bcrypt Password Hashing
* Helmet
* Express Rate Limiter

### Communication

* Nodemailer (Email OTP & Verification)

### Documentation

* Swagger/OpenAPI

### Development Tools

* ESLint
* Prettier
* Husky
* Nodemon

## Key Features

### Authentication & Security

* JWT Authentication
* Email OTP Verification
* Email Verification
* Password Encryption using Bcrypt
* QR Code Login
* NFC Login
* Request Rate Limiting
* Security Headers with Helmet

### Healthcare Management

* Healthcare Contract Management
* Nurse Performance Evaluation
* Service Tracking
* User Identity Verification

### Financial Operations

* Transaction Processing
* Refund Management

### Blockchain Integration

* Smart Contract Deployment
* Blockchain Transaction Verification
* On-chain Contract Storage
* Ethereum Sepolia Testnet Integration

### Dispute Resolution

* Dispute Creation
* Dispute Tracking
* Resolution Workflow Management

## Architecture

```text
Client Application
        │
        ▼
RESTful APIs
        │
        ▼
Express.js Backend
        │
 ┌──────┴──────┐
 ▼             ▼
MongoDB      Redis
 │
 ▼
Service Layer
 │
 ▼
Smart Contract Layer
 │
 ▼
Ethereum Sepolia Network
```

## Project Structure

```text
config/
src/
├── abi/            # Smart contract ABI definitions
├── controllers/    # Request handlers
├── middleware/     # Authentication and security middlewares
├── models/         # MongoDB schemas
├── routes/         # API routes
├── services/       # Business logic
└── utils/          # Utility functions

server.js
```

## Backend Responsibilities

As Backend Developer, I was responsible for:

* Designing and developing RESTful APIs using Node.js and Express.js.
* Implementing JWT-based authentication and authorization.
* Integrating Email OTP and Email Verification workflows.
* Developing QR/NFC-based login mechanisms.
* Designing MongoDB database models and relationships.
* Integrating Redis caching to improve system performance.
* Building and integrating blockchain smart contracts using Web3.js.
* Implementing transaction, refund, and dispute management modules.
* Securing APIs using Helmet and Rate Limiting.
* Documenting APIs using Swagger/OpenAPI.
* Deploying backend services on Render.

## Installation

### Clone Project

```bash
git clone <repository-url>
cd phuchwa-system
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
PORT=

MONGODB_URI=

JWT_SECRET=

REDIS_HOST=
REDIS_PORT=

EMAIL_USER=
EMAIL_PASSWORD=

WEB3_PROVIDER_URL=
PRIVATE_KEY=
```

### Run Development Environment

```bash
npm run dev
```

### Run Production Environment

```bash
npm start
```

## Future Improvements

* Docker Deployment
* Unit Testing
* CI/CD Pipeline
* Role-Based Access Control (RBAC)
* Smart Contract Auditing

```
```
