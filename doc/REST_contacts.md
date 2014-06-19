# /api/contacts

## GET /api/contacts

Get a the all contacts of the user.

**Request Headers:**

- Accept: application/json

**Request Parameters**

- owner (id): The id of the owner of the addressbook(s).
- address_books_id (id) : The id of an addressbook. This will return contacts from this particular addressbook.
- limit (int): The number of contacts to return. This will only keep the N first members (where N=limit). Default value is 50.
- offset (int): Start the list of contacts after skipping N members (where N=offset). For example, if the size of the contacts list is 100 and the offset is 50, the result list will contain only contacts from 50 to 99 (list index starts at index 0).
- search (string): Search the members "given_name" and "email" fields in case insensitive and accent agnostic way. Note that when there are more than one word in the search string (separated by one or more spaces), the search will become an AND. For example: 'search=foo bar' will search contacts where given_name and email contain foo AND bar.

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 200 OK. With the list of contacts and the total count
- 400 Bad Request. Invalid request body or parameters

**Request:**

    GET /api/contacts?owner=533d548263df5db21b485155
    Accept: application/json

**Response:**

    HTTP/1.1 200 OK
    X-Esn-Item-Count: 2
    [
        {
            "_id": "537efb2a078e20a54b21331a",
            "owner": "533d548263df5db21b485155",
            "timestamps": {
                "creation": "2014-05-23T08:13:49.664Z"
            },
            "emails": [
                "toto@loin.com"
            ],
            "addressbooks": [
                "537efb2a078e20a54b213319"
            ]
        },
        {
            "_id": "537efb2a078e20a54b21332d",
            "given_name": "John",
            "owner": "533d548263df5db21b485155",
            "timestamps": {
                 "creation": "2014-05-23T08:13:49.665Z"
            },
            "emails": [
                 "johndoe@gmail.com"
            ],
            "addressbooks": [
                "537efb2a078e20a54b213319"
            ]
        }
    ]


## GET /api/contacts/google/oauthurl

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Request:**

    GET /api/contacts/google/oauthurl
    Accept: application/json

**Response:**

    HTTP/1.1 200 OK
    {
        "url": https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/plus.me&redirect_uri=http://esndomain.com/api/contacts/google/callback&access_type=offline&client_id=[client_id]&hl=en&from_login=1&as=[key]&pli=1&authuser=1
    }

## GET /api/contacts/google/callback

**Request Headers:**

- Accept: application/json

**Response Headers:**

- Content-Length: Document size
- Content-Type: application/json

**Status Codes:**

- 500 Internal server error: there was a problem.

**Redirect (if OK):**

    Redirect /#/contacts

## POST /api/contacts/{contact_id}/invitations

Invite a contact to join a domain.
Only the domain manager is able to invite people to join a domain.

**Parameters**

- contact_id: The contact ID

**Request JSON Object:**

- domain_id: The domain to invite the user to

**Response Headers**

- Content-Length: Document size

**Status Codes:**

- 202 Accepted. The request has been received and an invitation will be sent to the contact email address.
- 400 Bad Request. Invalid request body or parameters.
- 403 Forbidden. The user who created the request is not authorized to invite contacts.

**Request:**

    POST /api/contacts/123456789/invitations
    Accept: application/json
    Host: localhost:8080
    {
      "domain_id": "92929200888181882993"
    }

**Response:**

    HTTP/1.1 202 Accepted

## GET /api/contacts/{contact_id}/invitations

Get the contact invitations.

**Parameters**

- contact_id: The contact ID

**Response Headers**

- Content-Length: Document size

**Status Codes:**

- 200 OK. With a list of invitations.
- 400 Bad Request. Invalid request body or parameters.
- 403 Forbidden. The user who created the request is not authorized to get the contact invitations.

**Request:**

    GET /api/contacts/123456789/invitations
    Accept: application/json
    Host: localhost:8080

**Response:**

    HTTP/1.1 200 OK
    []