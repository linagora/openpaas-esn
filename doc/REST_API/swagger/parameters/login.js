/**
 * @swagger
 * parameter:
 *   lg_credentials:
 *     name: credentials
 *     in: body
 *     description: The credentials for authentification.
 *     required: true
 *     schema:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *         rememberme:
 *           type: boolean
 *         recaptcha:
 *           type: object
 *           properties:
 *             data:
 *               type: object
 *             needed:
 *               type: boolean
 */
