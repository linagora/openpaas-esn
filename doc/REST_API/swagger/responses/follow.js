/**
 * @swagger
 * response:
 *   fl_user:
 *     description: Ok. With an array of users
 *     headers:
 *       "X-ESN-Items-Count":
 *         description: The total number of items which fulfill the query.
 *         type: integer
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/us_content"
 *   fl_follow:
 *     description: The follow information
 *     schema:
 *       $ref: "#/definitions/ResourceLink"
 */