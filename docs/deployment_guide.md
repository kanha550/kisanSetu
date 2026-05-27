# KisanSetu - Step-by-Step Deployment Guide

This guide details the prerequisites, local installation parameters, database configuration, sandbox testing accounts, and compilation steps to run KisanSetu on your development system.

---

## 1. System Prerequisites

Ensure you have the following software installed on your machine:
* **Node.js:** Version 18.0.0 or higher (Node v22 is highly recommended).
* **npm:** Version 9.0.0 or higher.
* **MongoDB:** A running MongoDB instance (either local installation or a MongoDB Cloud Atlas cluster). The application connects to a cloud instance defined in the backend environment file.

---

## 2. Directory Structure Review

Your codebase is structured into two core directories:
1. **`Backend`:** Express.js REST API server utilizing mongoose.
2. **`FrontEnd`:** React.js single-page application compiled using the Parcel bundler.

---

## 3. Backend Sourcing Configuration

### 3.1 Verify Environment Variables
Review the environment parameters inside `Backend/.env`:
* **`DB_CONNECT_STRING`:** The MongoDB connection URI.
* **`PORT`:** The server binding port (set to `550`).

### 3.2 Install & Boot Backend
Navigate to the `Backend` directory and start the server:

```bash
# Navigate to Backend
cd Backend

# Verify package installation
npm install

# Start the Node.js Express server
npm start
```

On start:
1. The server will connect to MongoDB Cloud Atlas.
2. **Automatic Database Seeding:** If the database is empty, the server will auto-populate verified accounts and six detailed crop listings with high-resolution image assets.
3. The server binds to port `550`, logging `Server is running at: http://localhost:550`.

---

## 4. Frontend Compilation & Server

### 4.1 Install Packages
Navigate to the `FrontEnd` directory and boot up the Parcel dev server:

```bash
# Navigate to FrontEnd
cd FrontEnd

# Verify package installation
npm install

# Boot up the local development server
npm start
```

### 4.2 Access the Application
Once Parcel compiles the assets, boot up your browser and navigate to:
👉 **`http://localhost:1234`**

---

## 5. Sandbox Testing Credentials

Since the database seeder auto-seeds default profiles if empty, you can instantly log in and test the end-to-end supply chain flows using the following mock credentials:

| S.No | Sourcing Role | Email Address | Password | Purpose |
|:---|:---|:---|:---|:---|
| 1 | **Farmer** | `farmer1@gmail.com` | `password123` | Punjab Sharbati Wheat inventory owner. |
| 2 | **Farmer** | `farmer2@gmail.com` | `password123` | Nashik Organic Red Onions owner. |
| 3 | **Buyer** | `buyer1@gmail.com` | `password123` | BigMart corporate purchasing lead. |
| 4 | **Buyer** | `buyer2@gmail.com` | `password123` | FreshBites restaurant sourcing lead. |
| 5 | **Admin** | `admin@kisansetu.com` | `password123` | System moderator and mediator. |

---

## 6. Sourcing Sprints & Sandbox Testing Flow

To test the application's transaction flow:
1. **Browse Sourcing:** Visit `http://localhost:1234` as a guest to browse crop catalog grids.
2. **Register/Login Buyer:** Sign in as `buyer1@gmail.com` with password `password123`.
3. **Cart Sourcing:** Browse, search for "wheat", adjust quantity to `20kg`, click "Add to Cart", visit the cart tab, enter a shipping address, and submit.
4. **Login Farmer:** Logout and sign in as `farmer1@gmail.com` with password `password123`.
5. **Manage Inventory / Orders:** Go to "Received Orders" tab to approve the purchase, and then mark it as "Shipped".
6. **Track Shipment:** Login back as `buyer1@gmail.com` and visit "My Orders". The progress stepper will show the status as "Shipped".
7. **Flag Disputes:** Once marked "Delivered", test the escrow dispute triggers by logging a dispute claim.
8. **Admin Mediation:** Sign in as `admin@kisansetu.com` with password `password123`. Open the dispute tickets tab to resolve or dismiss the filed claim.

---

## 7. Production Build Compilation

To generate statically compiled HTML/JS/CSS assets ready for production hosting:

```bash
# In FrontEnd directory
npm run build
```

This compiles static assets into `FrontEnd/dist/` ready to be hosted on Netlify, Vercel, or AWS S3.
