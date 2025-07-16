# College Student Directory API Examples

This document provides comprehensive examples for using the College Student Directory API.

## API Configuration

### Base URL
- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://api.college-directory.example.com/api/v1`

### API Versioning
The API uses versioning through URL prefixes and headers:
- **URL Prefix**: `/api/v1`
- **Version Header**: `X-API-Version: v1`

### Authentication
All endpoints except login and register require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Request Headers

### Standard Headers
```http
Content-Type: application/json
X-API-Version: v1
X-Request-ID: req_1705314600_abc123def
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response Headers
```http
X-API-Version: v1
X-Request-ID: req_1705314600_abc123def
X-Response-Time: 45ms
```

## Authentication Examples

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@college.edu",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "statusCode": 200,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "user": {
      "id": "clp1234567890abcdef123456",
      "email": "admin@college.edu",
      "name": "Admin User",
      "role": "ADMIN",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "tokenType": "Bearer"
  }
}
```

## Student Management Examples

### Create Student
```http
POST /api/v1/students
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "age": 20,
  "gender": "MALE",
  "address": "123 Main Street, City, State, ZIP",
  "admissionYear": 2024,
  "passoutYear": 2027,
  "course": "BCA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student created successfully",
  "statusCode": 201,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "id": "clp1234567890abcdef123456",
    "enrollmentNumber": "2024BCA001",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "age": 20,
    "gender": "MALE",
    "address": "123 Main Street, City, State, ZIP",
    "admissionYear": 2024,
    "passoutYear": 2027,
    "course": "BCA",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Students with Pagination
```http
GET /api/v1/students?page=1&limit=10&sortBy=name&sortOrder=asc&course=BCA
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "statusCode": 200,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": [
    {
      "id": "clp1234567890abcdef123456",
      "enrollmentNumber": "2024BCA001",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "course": "BCA",
      "admissionYear": 2024,
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Search Students
```http
GET /api/v1/students/search?q=John&page=1&limit=10
Authorization: Bearer <token>
```

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "details": [
    "Name is required",
    "Email must be valid"
  ]
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "UNAUTHORIZED",
  "statusCode": 401,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Rate Limit Error
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "error": "RATE_LIMIT_EXCEEDED",
  "statusCode": 429,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## File Upload Examples

### Upload Profile Image
```http
POST /api/v1/upload/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [binary data]
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "statusCode": 201,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "filename": "profile_image_1705314600.jpg",
    "originalName": "john_doe_photo.jpg",
    "mimetype": "image/jpeg",
    "size": 245760,
    "url": "/uploads/profiles/profile_image_1705314600.jpg",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Statistics Examples

### Get Student Statistics
```http
GET /api/v1/students/statistics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "statusCode": 200,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "totalStudents": 1250,
    "activeStudents": 1200,
    "totalCourses": 6,
    "studentsByCourse": {
      "BCA": 400,
      "MCA": 200,
      "BBA": 350,
      "MBA": 150,
      "BCOM": 100,
      "MCOM": 50
    },
    "studentsByYear": {
      "2024": 300,
      "2023": 350,
      "2022": 400,
      "2021": 200
    },
    "recentActivity": {
      "newStudentsThisMonth": 25,
      "attendanceMarkedToday": 150,
      "idCardsGeneratedThisWeek": 30
    }
  }
}
```

## Rate Limiting

The API implements rate limiting:
- **Limit**: 100 requests per minute per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

## API Versioning Strategy

### Current Version: v1
- All endpoints are prefixed with `/api/v1`
- Version header: `X-API-Version: v1`
- Backward compatibility maintained for minor updates

### Future Versions
- New versions will be introduced as `/api/v2`, etc.
- Previous versions will be supported for at least 12 months
- Deprecation notices will be provided 6 months in advance
