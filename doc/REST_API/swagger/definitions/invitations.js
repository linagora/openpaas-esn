/**
 * @swagger
 * definition:
 *   iv_data:
 *     properties:
 *       type:
 *         type: string
 *         enum:
 *           - addmember
 *           - console
 *           - signup
 *       data:
 *         type: object
 *   iv_document:
 *     properties:
 *       uuid:
 *         $ref: "#/definitions/cm_uuid"
 *       additionalProperties:
 *         $ref: "#/definitions/cm_document"
 */
