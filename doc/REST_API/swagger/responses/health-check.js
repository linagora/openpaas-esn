/**
 * @swagger
 * response:
 *   hc_response:
 *     description: The result returned when query for health status of all components
 *     schema:
 *       type: object
 *       $ref: "#/definitions/hc_all"
 *   hc_response_single:
 *     description: The result returned when query for health status of one single component
 *     schema:
 *       type: object
 *       $ref: "#/definitions/hc_one"
 *   hc_available:
 *     description: The result returned when query for all available services to perform health check
 *     schema:
 *       type: object
 *       $ref: "#/definitions/hc_available"
 */
