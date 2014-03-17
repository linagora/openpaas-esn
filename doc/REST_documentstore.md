# Document Store API

This describes the REST API for the document store resource. The document store resource is available at /api/document-store.

**Note**: This resource is only available during the application setup.

## Operations

### Check connection

Check if a connection can be established with the document store.

**Request**

- PUT /api/document-store/connection/:hostname/:port/:dbname
- Content Type: application/json

    {
      "username": "admin",
      "password": "supersecret"
    }

**Note**: The request body with username and password is optional.

**Response**

- HTTP 200 if a connection can be established with the document store
- HTTP 503 with JSON error message if there is a connection error.

### Save the configuration

Save the connection parameters on the server side.

**Request**

- PUT /api/document-store/connection
- Content Type: application/json

    {
      "hostname": "localhost",
      "port": 45678,
      "dbname": "hiveet",
      "username": "admin",
      "password": "supersecret"
    }

**Response**

- HTTP 201 if the configuration has been saved. Returns the application global configuration as response.

    {
      "webserver": {
        "enabled": true,
        "port": 8080,
        "virtualhosts": []
      },
      "wsserver": {
        "enabled": true,
        "port": 8080
      },
      "log": {
        "file": {
          "enabled": true,
          "filename": "./log/application.log",
          "level": "info",
          "handleExceptions": true,
          "json": false,
          "prettyPrint": true,
          "colorize": false
        },
        "console": {
          "enabled": true,
          "level": "debug",
          "handleExceptions": true,
          "json": false,
          "prettyPrint": true,
          "colorize": true
        }
      },
      "auth": {
        "strategies": ["local", "mongo"]
      }
    }

- HTTP 400 for client-side error
- HTTP 500 for server-side error
