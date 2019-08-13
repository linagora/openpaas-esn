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
 *     name: states
 *     in: body
 *     description: The user states
 *     required: true
 *     schema:
 *       $ref: "#/definitions/us_states"
 *   uss_emails:
 *     name: emails
 *     in: body
 *     description: The user emails
 *     required: true
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/us_email"
 *   uss_provision_source:
 *     name: source
 *     in: query
 *     description: The source for users provisioning
 *     required: true
 *     type: string
 *   uss_provision_data:
 *     name: provision data
 *     in: body
 *     description: The provisioning data
 *     schema:
 *       type: object
 */
