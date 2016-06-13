/**
 * @swagger
 * response:
 *   ds_check:
 *     description: |
 *       OK. A connection can be established with the document store
 *
 *       Optionally with the username and the password to connect to the document store
 *     schema:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *     examples:
 *       application/json:
 *         {
 *           "username": "admin",
 *           "password": "supersecret"
 *         }
 */
