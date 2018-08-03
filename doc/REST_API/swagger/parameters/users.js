/**
 * @swagger
 * parameter:
 *   uss_uuid:
 *     name: uuid
 *     in: path
 *     description: The user ID
 *     required: true
 *     type: string
 *     format: uuid
 *   uss_email:
 *     name: email
 *     in: query
 *     description: The user email
 *     required: true
 *     type: string
 *   uss_states:
 *    name: states
 *    in: body
 *    description: The user states
 *    required: true
 *    schema:
 *      $ref: "#/definitions/us_states"
 */
