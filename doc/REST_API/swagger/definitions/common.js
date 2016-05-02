/**
 * @swagger
 * definition:
 *   ProfileValue:
 *     description: "a JSON object containing a value property"
 *     properties:
 *       value:
 *         type: string
 *   OAuthClientResponse:
 *     properties:
 *       _id:
 *         type: string
 *         format: uuid
 *       clientSecret:
 *         type: string
 *       clientId:
 *         type: string
 *         format: uuid
 *       name:
 *         type: string
 *       redirectUri:
 *         type: string
 *       description:
 *         type: string
 *       creator:
 *         type: string
 *         format: uuid
 *       '__v':
 *         type: number
 *       schemaVersion:
 *         type: number
 *       created:
 *         type: string
 *         format: date-time
 *   ErrorResponse:
 *     required:
 *       - message
 *     properties:
 *       message:
 *         type: string
 */
