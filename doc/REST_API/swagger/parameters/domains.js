/**
 * @swagger
 * parameter:
 *   dm_name:
 *     name: name
 *     in: body
 *     description: The domain and company name.
 *     required: true
 *     schema:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         company_name:
 *           type: string
 *   dm_id:
 *     name: domain_id
 *     in: path
 *     description: The domain ID.
 *     required: true
 *     type: string
 *     format: uuid
 *   dm_adresses:
 *     name: adresses
 *     in: body
 *     description: Array of email addresses
 *     required: true
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/us_email"
 */
