# /api/jwt

## POST /api/jwt/generate

Generate a new JWT for the logged in user

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Response**

The encoded JWT, the payload contains the user preferred email as 'sub'.

**Status Codes:**

- 200 OK
- 401 Unauthorized. The user is not authenticated on the platform.
- 500 Server error. The JWT token cannot be generated, the jwt configuration may be missing.

**Request:**

    POST /api/jwt/generate
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWJqZWN0IjoiYWRtaW5Ab3Blbi1wYWFzLm9yZyIsImlhdCI6MTQ1MjY3NjQyM30.XLeJdkFhs6jj0poCtcl9cUmpz_J8xNLH__VsycgJG4q9hChAJVEHJpHzV-xoJPGDLJZIh3_N39PZucvpp9gMxY-GCb5u80CCkOhs2hEY7fBu74TLo7qbihVoVHXE_XkUGAc4NmepKn_wttuBuQzNdjfSNbM4fcEpv1zTHLfB_nUZfSJYHeSZFo7izVFuBGjVveMW-bbQMUulGHECHlWOVr1FgA6Tj_vwGydyrnO5sYaM3eETh-bHN-4Y8Rd0cn9p0XErKdq8YuiB673NP0ydvNWrrQbR9Y6GvvovDdOpplu7yQ18YWiRevmHwy_rprpUEqs0P_1ROREQV0NbDf1t4A"
