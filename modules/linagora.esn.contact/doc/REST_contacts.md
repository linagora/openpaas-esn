# /contact/api/contacts

## GET /contact/api/contacts/{addressBookId}/{contactId}/avatar

Get avatar of a contact:

- If the contact has avatar as an URL, redirect to that url.
- If the contact has avatar as a Base64 string, return image of that Base64.
- If the contact doesn't have avatar, return letter avatar based on first letter of formatted of the contact.
- If cannot get the contact, return 404 not found.

**Request URL Parameters:**

- `addressBookId`: The address book ID of user.
- `contactId`: The contact ID, color of letter avatar will be based on this ID.

**Request query:**

- `size` (optional): size of avatar in pixel, default value is 128.

**Response Headers:**

- Content-Type: image/png

**Status Codes:**

- 200 OK. Return image data of avatar.
- 302 Moved Temporarily. Redirect to existing external avatar url of the contact.
- 404 NOT FOUND. Can not get the contact from request.

**Request:**

    GET /contact/api/contacts/5594ef90e17e972c26d34e35/ddf378f6-1413-40f3-9bc9-aa8ea5af4baf/avatar?size=200
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
