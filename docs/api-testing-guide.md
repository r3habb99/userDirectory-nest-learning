# API Testing Guide

This guide provides comprehensive instructions for testing the College Student Directory API.

## Testing Tools

### Recommended Tools
1. **Postman** - GUI-based API testing
2. **curl** - Command-line testing
3. **Insomnia** - Alternative GUI tool
4. **Thunder Client** - VS Code extension

## Postman Collection Setup

### Environment Variables
Create a Postman environment with these variables:

```json
{
  "baseUrl": "http://localhost:3000/api/v1",
  "authToken": "",
  "apiVersion": "v1",
  "requestId": ""
}
```

### Pre-request Script (Global)
```javascript
// Generate unique request ID
pm.environment.set("requestId", "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11));

// Set API version header
pm.request.headers.add({
    key: "X-API-Version",
    value: pm.environment.get("apiVersion")
});

// Set request ID header
pm.request.headers.add({
    key: "X-Request-ID",
    value: pm.environment.get("requestId")
});
```

### Test Script (Global)
```javascript
// Test response time
pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

// Test response headers
pm.test("Response has required headers", function () {
    pm.expect(pm.response.headers.get("X-API-Version")).to.exist;
    pm.expect(pm.response.headers.get("X-Request-ID")).to.exist;
});

// Test response structure
pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("success");
    pm.expect(jsonData).to.have.property("message");
    pm.expect(jsonData).to.have.property("statusCode");
    pm.expect(jsonData).to.have.property("timestamp");
});

// Save auth token from login response
if (pm.request.url.toString().includes("/auth/login") && pm.response.code === 200) {
    const responseJson = pm.response.json();
    if (responseJson.success && responseJson.data.accessToken) {
        pm.environment.set("authToken", responseJson.data.accessToken);
    }
}
```

## Test Scenarios

### 1. Authentication Flow

#### Login Test
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-API-Version: v1" \
  -d '{
    "email": "admin@college.edu",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
- Status: 200
- Body contains: `success: true`, `data.accessToken`

#### Invalid Login Test
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-API-Version: v1" \
  -d '{
    "email": "admin@college.edu",
    "password": "wrongpassword"
  }'
```

**Expected Response:**
- Status: 401
- Body contains: `success: false`, `error: "UNAUTHORIZED"`

### 2. Student Management Tests

#### Create Student Test
```bash
curl -X POST http://localhost:3000/api/v1/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-API-Version: v1" \
  -d '{
    "name": "Test Student",
    "email": "test@example.com",
    "phone": "+1234567890",
    "age": 20,
    "gender": "MALE",
    "address": "123 Test Street",
    "admissionYear": 2024,
    "passoutYear": 2027,
    "course": "BCA"
  }'
```

#### Validation Error Test
```bash
curl -X POST http://localhost:3000/api/v1/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-API-Version: v1" \
  -d '{
    "name": "",
    "email": "invalid-email",
    "age": 15
  }'
```

**Expected Response:**
- Status: 400
- Body contains: `success: false`, `error: "VALIDATION_ERROR"`, `details` array

### 3. Pagination Tests

#### Test Pagination Parameters
```bash
curl -X GET "http://localhost:3000/api/v1/students?page=1&limit=5&sortBy=name&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-API-Version: v1"
```

**Expected Response:**
- Status: 200
- Body contains: `pagination` object with `page`, `limit`, `total`, `totalPages`

#### Test Invalid Pagination
```bash
curl -X GET "http://localhost:3000/api/v1/students?page=0&limit=1000" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-API-Version: v1"
```

### 4. Search Tests

#### Valid Search Test
```bash
curl -X GET "http://localhost:3000/api/v1/students/search?q=John" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-API-Version: v1"
```

#### Short Query Test
```bash
curl -X GET "http://localhost:3000/api/v1/students/search?q=J" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-API-Version: v1"
```

**Expected Response:**
- Status: 400
- Body contains: `success: false`, message about minimum query length

### 5. File Upload Tests

#### Valid File Upload
```bash
curl -X POST http://localhost:3000/api/v1/upload/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-API-Version: v1" \
  -F "file=@/path/to/image.jpg"
```

#### Invalid File Type
```bash
curl -X POST http://localhost:3000/api/v1/upload/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-API-Version: v1" \
  -F "file=@/path/to/document.pdf"
```

### 6. Rate Limiting Tests

#### Test Rate Limit
```bash
# Run this script to test rate limiting
for i in {1..110}; do
  curl -X GET http://localhost:3000/api/v1/students/statistics \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "X-API-Version: v1" \
    -w "Request $i: %{http_code}\n" \
    -s -o /dev/null
done
```

**Expected Behavior:**
- First 100 requests: Status 200
- Subsequent requests: Status 429

## Automated Testing with Newman

### Install Newman
```bash
npm install -g newman
```

### Run Collection
```bash
newman run college-api-collection.json \
  -e college-api-environment.json \
  --reporters cli,html \
  --reporter-html-export test-results.html
```

## Performance Testing

### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Authorization: 'Bearer YOUR_TOKEN'
      X-API-Version: 'v1'

scenarios:
  - name: "Get students"
    requests:
      - get:
          url: "/api/v1/students"
```

### Run Load Test
```bash
artillery run artillery-config.yml
```

## Test Data Management

### Setup Test Data
```sql
-- Create test admin user
INSERT INTO admins (id, name, email, password, role) VALUES 
('test-admin-id', 'Test Admin', 'test@college.edu', 'hashed_password', 'ADMIN');

-- Create test students
INSERT INTO students (name, email, phone, age, gender, course, admission_year) VALUES 
('John Doe', 'john@test.com', '+1234567890', 20, 'MALE', 'BCA', 2024),
('Jane Smith', 'jane@test.com', '+1234567891', 19, 'FEMALE', 'MCA', 2024);
```

### Cleanup Test Data
```sql
-- Remove test data
DELETE FROM students WHERE email LIKE '%@test.com';
DELETE FROM admins WHERE email = 'test@college.edu';
```

## Common Test Assertions

### Response Structure Tests
```javascript
// Postman test script
pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("success");
    pm.expect(jsonData).to.have.property("message");
    pm.expect(jsonData).to.have.property("statusCode");
    pm.expect(jsonData).to.have.property("timestamp");
    
    if (jsonData.success) {
        pm.expect(jsonData).to.have.property("data");
    } else {
        pm.expect(jsonData).to.have.property("error");
    }
});
```

### Pagination Tests
```javascript
pm.test("Pagination structure is correct", function () {
    const jsonData = pm.response.json();
    if (jsonData.pagination) {
        pm.expect(jsonData.pagination).to.have.property("page");
        pm.expect(jsonData.pagination).to.have.property("limit");
        pm.expect(jsonData.pagination).to.have.property("total");
        pm.expect(jsonData.pagination).to.have.property("totalPages");
        pm.expect(jsonData.pagination).to.have.property("hasNext");
        pm.expect(jsonData.pagination).to.have.property("hasPrev");
    }
});
```

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Check if token is valid and not expired
2. **400 Bad Request**: Verify request body format and required fields
3. **429 Rate Limited**: Wait for rate limit reset or use different IP
4. **500 Internal Error**: Check server logs for detailed error information

### Debug Headers
Always include these headers for debugging:
- `X-Request-ID`: For request tracking
- `X-API-Version`: For version verification
