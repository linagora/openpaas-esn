# /api/document-store

**Note**: This resource is only available during the application setup.

## PUT /api/document-store/connection/{hostname}/{port}/{dbname}

Check if a connection can be established with the document store.

**Parameters:**

- hostname: The hostname where the document store is hosted
- port: The port on which the document store is listeningn to incoming requests
- dbname: The database name

**Request Headers:**

- Accept: application/json

**Request JSON Object:**

The username and password are optional.

- username: The username used to connect to the document store
- password: The password used to connect to the document store

**Status Codes:**

- 200 OK. A connection can be established with the document store
- 400 Bad Request. Invalid request body or parameters
- 503 Service Unavailable. With a JSON error message if there is a connection error.

**Request:**

    PUT /api/document-store/connection/localhost/27017/esn
    Accept: application/json
    Host: localhost:8080
    {
        "username": "admin",
        "password": "supersecret"
    }

**Response:**

    HTTP/1.1 200 OK

## PUT /api/document-store/connection

Save the connection parameters on the server side.

**Request Headers:**

- Accept: application/json

**Request JSON Object:**

- hostname: The database hostname
- port: The database port
- dbname: The database name
- username: The username used to connect to the database
- password: The password used to connect to the database

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 201 Created. The configuration has been saved.
- 400 Bad Request. Invalid request body or parameters

**Request:**

    PUT /api/document-store/connection
    Accept: application/json
    Host: localhost:8080
    {
        "hostname": "localhost",
        "port": 45678,
        "dbname": "hiveet",
        "username": "admin",
        "password": "supersecret"
    }

**Response:**

    HTTP/1.1 201 Created
    {
      "connectionOptions": {
        "db": {
          "w": 1,
          "fsync": true,
          "native_parser": true
        },
        "server": {
          "socketOptions": {
            "keepAlive": 10000,
            "connectTimeoutMS": 10000
          },
          "auto_reconnect": true,
          "poolSize":10
        }
      },
      "connectionString": "mongodb://localhost:27017/esn"
    }
