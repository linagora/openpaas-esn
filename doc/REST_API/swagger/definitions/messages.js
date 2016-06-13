/**
 * @swagger
 * definition:
 *   msg_not_found:
 *     description: object returned when a message is not found
 *     properties:
 *       error:
 *         type: object
 *         properties:
 *           status:
 *             type: integer
 *           message:
 *             type: string
 *           details:
 *             type: string
 *   msg_query_response:
 *     description: refers either to a message document or to an error message
 *     type: object
 *     enum:
 *       - $ref: "#/definitions/msg_document"
 *       - $ref: "#/definitions/msg_not_found"
 *   msg_object:
 *     type: object
 *     properties:
 *       objectType:
 *         type: string
 *       content:
 *         type: string
 *       attachments:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             _id:
 *               $ref: "#/definitions/cm_uuid"
 *             name:
 *               type: string
 *             contentType:
 *               type: string
 *             length:
 *               type: integer
 *       parsers:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *       data:
 *         type: object
 *   msg_document:
 *     description: message document content
 *     properties:
 *       "_id":
 *         $ref: "#/definitions/cm_uuid"
 *       "__v":
 *         type: integer
 *       creator:
 *         $ref: "#/definitions/cm_uuid"
 *       timestamps:
 *         $ref: "#/definitions/cm_timestamps"
 *       additionalProperties:
 *         $ref: "#/definitions/msg_object"
 *   msg_resource:
 *     type: object
 *     properties:
 *       objectType:
 *         type: string
 *       id:
 *         $ref: "#/definitions/cm_uuid"
 *   msg_targets:
 *     type: array
 *     items:
 *       $ref: "#/definitions/msg_resource"
 *   msg_message_nominal:
 *     properties:
 *       object:
 *         $ref: "#/definitions/msg_object"
 *       targets:
 *         $ref: "#/definitions/msg_targets"
 *   msg_message_inReplyTo:
 *     properties:
 *       object:
 *         $ref: "#/definitions/msg_object"
 *       inReplyTo:
 *         $ref: "#/definitions/msg_object"
 *   msg_message:
 *     type: object
 *     enum:
 *       - $ref: "#/definitions/msg_message_nominal"
 *       - $ref: "#/definitions/msg_message_inReplyTo"
 */
