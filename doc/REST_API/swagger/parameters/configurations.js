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
 *   cf_modules_scope:
 *     name: scope
 *     in: query
 *     description: The configuration scope.
 *     required: true
 *     type: string
 *     enum:
 *       - 'user'
 *       - 'domain'
 *       - 'platform'
 *   cf_modules_domain_id:
 *     name: domain_id
 *     in: query
 *     description: The domain ID you want to get configuration of, required when scope is domain.
 *     type: string
 *   cf_modules_inspect
 *     name: inspect
 *     in: query
 *     description: Set if you want to inspect configurations by getting all readable configurations,
 *      each configuration then have `writable` field indicating the configuration is writable or not
 *     type: boolean
 */
