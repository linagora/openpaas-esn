# Monitoring API

This describes the REST API for the monitoring resource.
The monitoring resource is available at /api/monitoring.

## Operations

### Get the application monitoring data

The application provides a collection of monitoring data which may be useful to clients/managers.

**Request**

- GET /api/monitoring

**Response**

- HTTP 200

    {
      "lag": 134
    }
