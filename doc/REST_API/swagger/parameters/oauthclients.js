/**
 * @swagger
 * parameter:
 *   oauth_id:
 *     name: id
 *     in: path
 *     description: the oauth client id
 *     type: string
 *     format: uuid
 *     required: true
 *   oauth_application:
 *     name: application
 *     in: body
 *     description: oauth client description
 *     required: true
 *     schema:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         redirectUri:
 *           type: string
 */
