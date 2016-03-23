# /api/profile

## GET /api/users/{uuid}/profile

Get a user profile.

**Parameters**

- uuid: The user ID

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. With the user profile
- 400 Bad Request. Invalid request body or parameters
- 404 Not Found. The user has not been found

**Request:**

    GET /api/users/34560130/profile
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    {
        _id: 123456789,
        firstname: "John",
        lastname: "Doe",
        emails: ["johndoe@linagora.com"]
    }

## PUT /api/user/profile

Update a user profile

**Request Headers:**

- Accept: application/json

**Request JSON Object:**

- firstname: The user firstname
- lastname: The user lastname
- job_title: The user job title
- service: The service that the user is working on
- building_location: The location of the building that the user is working at
- office_location: The location of the user office
- main_phone: The user main phone.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. With the user profile

**Request:**

    PUT /api/user/profile
    Accept: application/json
    Host: localhost:8080
    {
        firstname: "John",
        lastname: "Amaly",
        job_title: "Engineer",
        service: "IT",
        building_location: "Tunis",
        office_location: "France",
        main_phone: "123456789"
    }

**Response:**

    HTTP/1.1 200 OK  
    {
        firstname: "John",
        lastname: "Amaly",
        job_title: "Engineer",
        service: "IT",
        building_location: "Tunis",
        office_location: "France",
        main_phone: "123456789"
    }
