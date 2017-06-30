/**
 * @swagger
 * response:
 *   cf_modules:
 *     description: Ok. With an array of modules configuration
 *     schema:
 *       $ref: "#/definitions/cf_modules"
 *     examples:
 *       application/json:
 *         [
 *           {
 *             "name":"core",
 *             "configurations":
 *               [
 *                 {
 *                   "name": "homePage",
 *                   "value": "calendar",
 *                   "writable": "true"
 *                 }
 *               ]
 *           }
 *         ]
 */
