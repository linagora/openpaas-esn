/**
 * @swagger
 * definition:
 *   CommunityResponse:
 *     properties:
 *       _id:
 *         type: string
 *         format: uuid
 *       title:
 *         type: string
 *       description:
 *         type: string
 *       domain_ids:
 *         type: array
 *         items:
 *           type: string
 *           format: uuid
 *       timestamps:
 *         type: object
 *         properties:
 *           creation:
 *             type: string
 *             format: date-time
 *       activity_stream:
 *         type: object
 */
