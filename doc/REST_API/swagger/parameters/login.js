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
 *   lg_passwordresetemail:
 *     name: passwordresetemail
 *     in: body
 *     description: the email requesting the password reset
 *     required: true
 *     schema:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *   lg_passwordreset:
 *     name: passwordreset
 *     in: body
 *     description: the new password of the user
 *     required: true
 *     schema:
 *       type: object
 *       properties:
 *         password:
 *           type: string
 */
