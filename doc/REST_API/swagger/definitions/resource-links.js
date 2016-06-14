/**
 * @swagger
 * definition:
 *   ResourceLinkRequest:
 *     type: object
 *     properties:
 *       source:
 *         $ref: "#/definitions/Tuple"
 *       target:
 *         $ref: "#/definitions/Tuple"
 *       type:
 *         type: string
 *   ResourceLink:
 *     type: object
 *     properties:
 *       source:
 *         $ref: "#/definitions/Tuple"
 *       target:
 *         $ref: "#/definitions/Tuple"
 *       type:
 *         type: string
 *       timestamps:
 *         type: object
 *         properties:
 *           creation:
 *             type: string
 *             format: date-time
 */
