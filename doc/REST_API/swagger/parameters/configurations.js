/**
 * @swagger
 * parameter:
 *   cf_modules:
 *     name: modules
 *     in: body
 *     description: The list of modules configuration to update
 *     required: true
 *     schema:
 *       $ref: "#/definitions/cf_modules"
 *   cf_modules_with_keys:
 *     name: modules
 *     in: body
 *     description: The list of modules to get configurations
 *     required: true
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/cf_module_request"
 */
