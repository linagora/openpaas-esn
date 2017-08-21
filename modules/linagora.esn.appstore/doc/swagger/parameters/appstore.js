/**
  * @swagger
  * parameter:
  *   appstore_artifact_id:
  *     name: artifactId
  *     in: path
  *     description: The id of the artifact
  *     required: true
  *     type: string
  *   appstore_app_id:
  *     name: id
  *     in: path
  *     description: The application id
  *     required: true
  *     type: string
  *   appstore_object_type:
  *     name: objectType
  *     in: query
  *     description: The type of the object
  *     required: false
  *     type: string
  *   appstore_version:
  *     name: version
  *     in: query
  *     description: The version of the artifact.
  *     required: false
  *     type: string
  *   appstore_target:
  *     name: target
  *     in: body
  *     description: A tuple which describes the community/project in which the application is deployed and available.
  *     required: true
  *     schema:
  *       $ref: "#/definitions/appstore_tuple"
  *   appstore_format:
  *     name: format
  *     in: query
  *     description: The maximum number of activities to include in the stream.
  *     required: false
  *     type: string
  *   appstore_mime_type:
  *     name: mimetype
  *     in: query
  *     description: The MIME type of the artifact.
  *     required: false
  *     type: string
  *     enum:
  *       - application
  *       - zip
  *   appstore_size:
  *     name: size
  *     in: query
  *     description: The size, in bytes, of the POSTed artifact. This size will be compared with the number of bytes recorded in the file storage service, thus ensuring that there were no data loss.
  *     required: false
  *     type: string
  *   appstore_application:
  *     name: detail
  *     in: body
  *     description: Title and description to create application
  *     required: true
  *     schema:
  *       $ref: "#/definitions/appstore_application"
  */
