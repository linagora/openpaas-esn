/**
 * @swagger
 * parameter:
 *   iv_content:
 *     name: content
 *     in: body
 *     description: invitation description
 *     required: true
 *     schema:
 *       type: object
 *       properties:
 *         "type":
 *           type: string
 *         data:
 *           type: object
 *   iv_uuid:
 *     name: uuid
 *     in: path
 *     description: the invitation identifier
 *     required: true
 *     type: string
 *     format: uuid
 */
