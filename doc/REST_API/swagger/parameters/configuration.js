/**
 * @swagger
 * parameter:
 *   cf_uuid:
 *     name: uuid
 *     in: path
 *     description: The identifier of the domain
 *     required: true
 *     type: string
 *     format: uuid
 *   cf_names:
 *     name: configNames
 *     in: body
 *     description: list of configuration names
 *     type: array
 *     items:
 *       type: string
 *     required: true
 *   cf_configs:
 *     name: configs
 *     in: body
 *     description: list of configurations
 *     type: array
 *     items:
 *       $ref: "#/definitions/cf_config"
 *     required: true
 */