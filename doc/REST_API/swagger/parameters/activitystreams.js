/**
  * @swagger
  * parameter:
  *   as_uuid:
  *     name: uuid
  *     in: path
  *     description: The identifier of the activity stream.
  *     required: true
  *     type: string
  *     format: uuid
  *   as_before:
  *     name: before
  *     in: query
  *     description: Determines the last activity ID of the stream. (this is the default)
  *     required: false
  *     type: string
  *   as_after:
  *     name: after
  *     in: query
  *     description: Determines the previous activity ID of the stream.
  *     required: false
  *     type: string
  *   as_limit:
  *     name: limit
  *     in: query
  *     description: The maximum number of activities to include in the stream.
  *     required: false
  *     type: integer
  *   as_domainid:
  *     name: domainid
  *     in: query
  *     description: Optional identifier of the domain in which to get the communities activity streams.
  *     required: false
  *     type: string
  *     format: uuid
  *   as_writable:
  *     name: writable
  *     in: query
  *     description: When set to true, get only activitystreams for which the user can publish into.
  *     required: false
  *     type: boolean
  *   as_name:
  *     name: name
  *     in: query
  *     description: Get only streams where the attached resource match or contains the given name.
  *     required: false
  *     type: string
  *   as_member:
  *     name: member
  *     in: query
  *     description: Get only the activitystreams where the current user is member of the linked collaboration.
  *     required: false
  *     type: boolean
  *
  */
