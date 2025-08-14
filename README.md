# User Authentication Server

This project is a backend server built with Node.js and Express.js, featuring user registration, login, and authentication using JWTs and email OTP verification.

---

## Setup and Usage Instructions

### 1. Clone the Repository
Clone the project to your local machine.
```bash
git clone [https://github.com/Souravp07/user-auth.git](https://github.com/Souravp07/user-auth.git)
cd user-auth
```

### 2. Install Dependencies
Install all the required npm packages.
```bash
npm install
```

### 3. Database Setup
- Ensure you have a MySQL server running.
- Create a new database (e.g., `auth_db`).
- Execute the `database.sql` script provided in the repository to create the `users` table with the required schema.

### 4. Environment Configuration
- Create a `.env` file in the root directory of the project.
- Populate it with the necessary credentials by following the structure in the `.env.example` file. This includes:
  - Database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)
  - A secret key for JWT (`JWT_SECRET`)
  - Nodemailer configuration for sending OTP emails (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`)

### 5. Run the Server
To start the server in development mode with `nodemon` (which will automatically restart on file changes), run:
```bash
npm run dev
```
The server will be running on `http://localhost:5000` (or the port specified in your `.env` file).

---

## Key Features & Dependencies

The implementation includes API endpoints for user registration (with email OTP verification), login, and a protected route for changing passwords. Best practices for folder structure and error handling have been followed.

### Additional Dependencies
The project relies on the following key npm packages:

- **express**: Web framework for Node.js.
- **mysql2**: MySQL client for Node.js.
- **jsonwebtoken**: For generating and verifying JSON Web Tokens.
- **bcryptjs**: For hashing passwords.
- **nodemailer**: For sending OTP verification emails.
- **dotenv**: For managing environment variables.
- **cors**: To enable Cross-Origin Resource Sharing.
- **nodemon**: As a development dependency for automatic server restarts.
