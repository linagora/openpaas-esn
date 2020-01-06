/**
 * @swagger
 * parameter:
 *   tu_technicaluser_id:
 *     name: technicaluser_id
 *     in: path
 *     description: The technical user ID.
 *     required: true
 *     type: string
 *   tu_payload:
 *     name: payload
 *     in: body
 *     description: The payload which is used to create or update technical user.
 *     required: true
 *     schema:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *         data:
 *           type: object
 */
