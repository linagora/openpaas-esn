/**
 * @swagger
 * definition:
 *   hc_all:
 *     properties:
 *       checks:
 *         type: array
 *         items:
 *           type: object
 *           description: detail status of component
 *           properties:
 *             componentName:
 *               type: string
 *               description: The name of the component
 *             status:
 *               type: string
 *               description: The status of the component
 *             cause:
 *               type: string
 *               description: The detail message from the throwable
 */
