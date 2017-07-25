/**
  * @swagger
  * parameter:
  *   contact.import_type:
  *     name: type
  *     in: path
  *     description: The type of contacts to import.
  *     required: true
  *     type: string
  *   contact.import_account_id:
  *     name: account_id
  *     in: body
  *     description: The ID of the account to import contacts from.
  *     required: true
  *     schema:
  *       type: object
  *       properties:
  *         account_id:
  *           $ref: "#/definitions/cm_id"
  */
