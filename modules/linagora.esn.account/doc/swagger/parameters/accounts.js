/**
  * @swagger
  * parameter:
  *   account_id:
  *     name: id
  *     in: path
  *     description: The account ID.
  *     required: true
  *     schema:
  *       $ref: "#/definitions/cm_id"
  *   account_type:
  *     name: type
  *     in: query
  *     description: The type of account to get.
  *     required: true
  *     type: string
  *     enum:
  *       - email
  *       - oauth
  */
