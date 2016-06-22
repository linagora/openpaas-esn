/**
 * @swagger
 * definition:
 *   TimelineEntry:
 *     type: object
 *     properties:
 *       verb:
 *         type: string
 *         description: The type of timeline entry 'like', 'post', 'follow', 'update'
 *       language:
 *         type: string
 *       published:
 *         type: string
 *         format: date-time
 *       actor:
 *         type: object
 *         properties:
 *           objectType:
 *             type: string
 *           _id:
 *             type: string
 *           image:
 *             type: string
 *           displayName:
 *             type: string
 *       object:
 *         $ref: "#/definitions/Tuple"
 *       target:
 *         type: array
 *         items:
 *           $ref: "#/definitions/Tuple"
 *       inReplyTo:
 *         type: array
 *         items:
 *           $ref: "#/definitions/Tuple"
 *       to:
 *         $ref: "#/definitions/Tuple"
 */
