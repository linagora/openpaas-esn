/**
 * @swagger
 * definition:
 *   nt_document:
 *     description: "notification document content"
 *     properties:
 *       _id:
 *         $ref: "#/definitions/cm_tuple_id"
 *       subject:
 *         $ref: "#/definitions/cm_tuple"
 *       verb:
 *         type: object
 *         properties:
 *           label:
 *             type: string
 *           text:
 *             type: string
 *       complement:
 *         $ref: "#/definitions/cm_tuple"
 *       category:
 *         type: string
 *       acknowledged:
 *         type: boolean
 *       read:
 *         type: boolean
 *       target:
 *         type: array
 *         items:
 *           $ref: "#/definitions/cm_tuple"
 *       action:
 *         type: string
 *       interactive:
 *         type: boolean
 *       timestamps:
 *         $ref: "#/definitions/cm_timestamps"
 */
