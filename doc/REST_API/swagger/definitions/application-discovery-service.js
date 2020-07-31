/**
 * @swagger
 * definition:
 *  spa_name:
 *    type: object
 *    properties:
 *      en:
 *        type: string
 *  spa_icon:
 *    type: object
 *    properties:
 *      type:
 *        type: string
 *      data:
 *        type: string
 *  spa_object:
 *    description: the SPA object
 *    type: object
 *    properties:
 *      id:
 *        type: string
 *      type:
 *        type: string
 *      icon:
 *        $ref: "#/definitions/spa_icon"
 *      url:
 *        type: string
 *      name:
 *        $ref: "#/definitions/spa_name"
 *      weight:
 *        type: integer
 */
