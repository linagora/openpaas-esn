# Monitoring API

This describes the REST API for the monitoring resource.
The monitoring resource is available at /api/monitoring.

## Operations

### GET /api/monitoring

Get monitoring data. The application provides a collection of monitoring data which may be useful to clients/managers.

**Response**

- HTTP 200 with monitoring data as JSON

    {
      "lag": 134
    }
