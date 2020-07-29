/**
  * @swagger
  * parameter:
  *   av_object_type:
  *     name: objectType
  *     in: query
  *     description: The resource type to retrieve avatar from.
  *     required: true
  *     type: string
  *     enum:
  *       - 'user'
  *       - 'community'
  *       - 'image'
  *       - 'email'
  *   av_email:
  *     name: email
  *     in: query
  *     description: If objectType is 'user' or 'email' or if no objectType is given, the parameter value must be an email
  *     type: string
  *   av_id:
  *     name: id
  *     in: query
  *     description: If objectType is 'community', the parameter value is the id of the community. If the object type is 'image', the id is the image id.
  *     required: false
  *     type: string
  *     format: uuid
  *   av_format:
  *     name: format
  *     in: query
  *     description: If format is set to 'original', send back the original avatar which has been uploaded, else send back the 128px x 128px one.
  *     required: false
  *     type: string
  *   av_if_modified_since:
  *     name: if_modified_since
  *     in: header
  *     description: if the requested avatar has not been modified since the time specified in this field, the avatar will not be returned
  *     required: false
  *     type: string
  *     format: date-time
  *   av_mimetype:
  *     name: mimetype
  *     in: query
  *     description: the MIME type of the avatar. Valid values are 'image/png', 'image/gif' and 'image/jpeg'
  *     required: true
  *     type: string
  *     enum:
  *       - 'image/png'
  *       - 'image/gif'
  *       - 'image/jpeg'
  *   av_size:
  *     name: size
  *     in: query
  *     description: |
  *       the size, in bytes, of the POSTed image.
  *
  *       This size will be compared with the number of bytes recorded in the file storage service, thus ensuring that there were no data loss.
  *     required: true
  *     type: integer
  *   av_raw_data:
  *     name: raw_data
  *     in: formData
  *     type: file
  *     description: the raw file data.
  *     required: true
  *     x-parameter-content-type: image/png
  */
