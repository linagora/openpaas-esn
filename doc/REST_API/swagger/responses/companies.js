/**
 * @swagger
 * response:
 *   cp_companies:
 *     description: Ok. With an array of companies where company is defined as name
 *     schema:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           name:
 *             type: string
 *     examples:
 *       application/json:
 *         [
 *           {
 *             "name": "The company name"
 *           }
 *         ]
 */
