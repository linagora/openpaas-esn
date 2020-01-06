/**
 * @swagger
 * response:
 *   tu_technicaluser:
 *     description: Ok. With an entity of technical user
 *     schema:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *         domain:
 *           type: string
 *         data:
 *           type: object
 *   tu_technicalusers_list:
 *     description: Ok. With an array of technical users
 *     schema:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           name:
 *             type: string
 *           description:
 *             type: string
 *           type:
 *             type: string
 *           data:
 *             type: object
 *     examples:
 *       application/json:
 *         [
 *           {
 *             "name": "James",
 *             "description": "descriptions about James",
 *             "type": "technical",
 *             "data": "Dummy data"
 *           },
 *           {
 *             "name": "Sabre",
 *             "description": "descriptions about Sabre",
 *             "type": "technical",
 *             "data": "Dummy data"
 *            }
 *         ]
 */
