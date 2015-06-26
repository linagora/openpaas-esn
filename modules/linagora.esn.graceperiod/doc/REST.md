# /graceperiod/api

## DELETE /graceperiod/api/tasks/{id}

Abort a task which has ben added to the grace period component.

**Parameters**

- id: The task ID

**Status Codes:**

- 204 No content. The task has been cancelled.
- 401 Unauthorized. The user is not authenticated on the platform.
- 403 Forbidden. The user can not cancel the task.
- 404 Not found. No such task, or the task is already complete.

**Request:**

    DELETE /graceperiod/api/tasks/123456789
    Host: localhost:8080

**Response:**

    HTTP/1.1 204 No content
