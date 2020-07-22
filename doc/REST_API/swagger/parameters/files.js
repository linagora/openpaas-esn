/**
 * @swagger
 * parameter:
 *   fi_name:
 *     name: name
 *     in: query
 *     description: The filename to store.
 *     required: false
 *     type: string
 *   fi_mimetype:
 *     name: mimetype
 *     in: query
 *     description: The MIME type of the data being stored
 *     required: true
 *     type: string
 *   fi_size:
 *     name: size
 *     in: query
 *     description: The expected file size. This will be compared with the bytes received, ensuring there is no dataloss.
 *     required: true
 *     type: integer
 *   fi_raw_data:
 *     name: raw_data
 *     in: formData
 *     type: file
 *     description: the raw file data.
 *     required: true
 *   fi_id:
 *     name: id
 *     in: path
 *     description: The file id
 *     required: true
 *     type: string
 *     format: uuid
 */
