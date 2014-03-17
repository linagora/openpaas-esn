# REST API Overview

This describes the implemented REST API of the official Hiveety API v1. The Hiveety REST API is implemented using the HTTP protocol, and the JSON data format.

## Conventions

In this present document, the following conventions are applied:

- **uid** : the uid stands for Unique IDentifier. Two resources of the same type can't have the same uid.
- {something} : brackets marks some variable that need to be changed at runtime.
    Example:

        GET /api/{resource type}/1

    Here we mean that {resource type} should be replaced by the real resource type.

## Prefix

The Hiveety REST API is always prefixed by **/api**.

## Verbs

### GET
The GET verb is used to fetch resources.

#### Fetching a resource using its unique ID.

* **Method**: GET
* **URI**: /api/{resource type}/{uid}
* **returns**: a JSON object of the resource

#### Searching for resources

* **Method**: GET
* **URI**: /api/{resource type}
* **parameter(s)**: {search field}={search value}
* **returns**: an array of the JSON objects of resources matching the search

### PUT
The PUT verb is used to store a resource. The stored resource can exist or be a new one.

* **Method**: PUT
* **URI**: /api/{resource type}/{uid}
* **Request Content-type**: application/json
* **Request body**: a JSON object of the resource
* **returns**: the status code 201 if the resource has been created, 200 if the resource has been updated, or an error code (4XX or 5XX)

### POST
The POST verb is used to store a resource. However, when POSTing a resource, it's the server responsability to provide the uid of the resource.

* **Method**: POST
* **URI**: /api/{resource type}
* **Request Content-type**: application/json
* **Request body**: a JSON object of the resource
* **returns**: the status code 201 if the resource has been created, or an error code (4XX or 5XX). Note that a successful response body will be a JSON object, containing an **id** field that is the unique id that the server gave to the resource.

### DELETE
The DELETE verb is used to remove a resource.

* **Method**: DELETE
* **URI**: /api/{resource type}/{uid}
* **Request Content-type**: application/json
* **Request body**: a JSON object of the resource
* **returns**: the status code 200 if the resource has been deleted, or an error code (4XX or 5XX)


## Errors

In case of an error, the server will send a corresponding HTTP status code: 4xx for the client errors (for example, if the client didn't supply all the parameters required for an action), 5xx for the server error (for example, if the server have not written the data in the store due to a connectivity problem).
Error response body will be in JSON, and will have the following format:

    {
      error: {
                status: {the HTTP status code},
                message: {a generic message},
                details: {some more detailed informations}
             }
    }

Example:

    {
      error: {
               status: 400,
               message: "Bad Request",
               reason: "port must be greater than 0"
             }
    }

## Authentication

A large part of the API requires you to be authenticated. Authentication API are listed later in this document. Please note however that Hiveety server expect the authentication to be in a cookie header.

# Detailed API

For a better readability, REST API is split into several files :

* [company](REST_company.md)
* [domain](REST_domain.md)
