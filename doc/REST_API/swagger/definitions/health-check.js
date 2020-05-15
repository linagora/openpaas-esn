/**
 * @swagger
 * definition:
 *   hc_all:
 *     properties:
 *       checks:
 *         type: array
 *         items:
 *           type: object
 *           description: detail status of service
 *           $ref: "#/definitions/hc_one"
 *   hc_one:
 *     properties:
 *       componentName:
 *         type: string
 *         description: The name of the service
 *       status:
 *         type: string
 *         description: The status of the service
 *       cause:
 *         type: string
 *         description: The detail message from the throwable
 *       details:
 *         type: object
 *         description: Object contains detail informations of service.
 *   hc_available:
 *     properties:
 *       services:
 *         type: array
 *         items:
 *           type: string
 */
