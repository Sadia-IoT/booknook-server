# BookNook – Server

BookNook is a small online library management system where users can explore books, add their own books, borrow books, and manage their borrowing activities.

This repository contains the backend API of BookNook, built with Express.js, TypeScript, and MongoDB.

## Live Server

**API Base URL:** https://booknook-server-8kyc.onrender.com

## Technologies Used

- Node.js
- Express.js
- TypeScript
- MongoDB
- Better Auth JWT
- JOSE (JWT Verification)
- CORS

## Key Features

- RESTful API for book management.
- Retrieve all books and individual book details.
- Add, update, and delete books.
- Search and filter books through API queries.
- Borrow books and manage borrowing records.
- Return borrowed books and update available copies.
- JWT-based authentication and authorization.
- Protect private routes from unauthorized access.
- Restrict book management and borrowing activities to authorized users.
- Store book and borrowing information in MongoDB.

## API Endpoints

### Books

| Method | Endpoint | Description |
|---|---|---|
| GET | `/books` | Get all books |
| GET | `/books?limit=6` | Get latest books |
| GET | `/books/:id` | Get a single book |
| GET | `/books?email=user@example.com` | Get books by authenticated user |
| POST | `/books` | Add a new book |
| POST | `/books/bulk` | Add multiple books |
| PATCH | `/books/:id` | Update a book |
| DELETE | `/books/:id` | Delete a book |

### Borrowing

| Method | Endpoint | Description |
|---|---|---|
| GET | `/borrows?email=user@example.com` | Get user's borrowed books |
| POST | `/borrows` | Borrow a book |
| PATCH | `/borrows/:id/return` | Return a borrowed book |

**Note:** Private endpoints require a valid JWT access token in the Authorization header.

## Environment Variables

Create a `.env` file in the server root directory and configure the required environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
DB_NAME=booknook
AUTH_BASE_URL=your_better_auth_base_url
```

Never share or commit your actual database credentials or secret information.

## Installation and Setup

1. Clone the repository:

```bash
git clone https://github.com/Sadia-IoT/booknook-server.git
```

2. Navigate to the project directory:

```bash
cd booknook-server
```

3. Install dependencies:

```bash
npm install
```

4. Configure the `.env` file.

5. Start the development server:

```bash
npm run dev
```

6. Build the TypeScript project:

```bash
npm run build
```

## Security

- JWT verification protects private API routes.
- Users can only manage their own books.
- Users can only access and manage their own borrowing records.
- Sensitive credentials are stored in environment variables.

## Related Repository

**Client Repository:** https://github.com/Sadia-IoT/booknook-client

## Author

**Sadia Sultana**

BookNook – Your Digital Library 📚