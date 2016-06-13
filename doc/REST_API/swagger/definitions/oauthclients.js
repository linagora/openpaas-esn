/**
 * @swagger
 * definition:
 *   oauth_application:
 *     description: "oauth client application content"
 *     properties:
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       redirectUri:
 *         type: string
 *   oauth_document:
 *     description: "oauth client application document"
 *     properties:
 *       "__v":
 *         type: integer
 *       "_id":
 *         $ref: "#/definitions/cm_uuid"
 *       "clientSecret":
 *         type: string
 *       "clientId":
 *         type: string
 *       creator:
 *         $ref: "#/definitions/cm_uuid"
 *       "schemaVersion":
 *         type: integer
 *       created:
 *         $ref: "#/definitions/cm_date"
 *       additionalProperties:
 *         $ref: "#/definitions/oauth_application"
 */
