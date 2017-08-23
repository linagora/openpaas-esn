/**
  * @swagger
  * parameter:
  *   user.status_user_ids:
  *     name: ids
  *     in: body
  *     description: ID of users you want to get status.
  *     required: true
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/cm_id"
  *   user.status_user_id:
  *     name: id
  *     in: path
  *     description: ID of the user you want to get status
  *     required: true
  *     type: string
  */
