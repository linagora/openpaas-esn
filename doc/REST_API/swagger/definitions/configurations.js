/**
  * @swagger
  * definition:
  *   cf_key:
  *     description: "a key string"
  *     type: string
  *   cf_configuration:
  *     description: "a JSON object containing a configuration"
  *     properties:
  *       name:
  *         type: string
  *       value:
  *         type: object
  *       writable:
  *         type: boolean
  *   cf_module:
  *     description: "a JSON object containing a module configuration"
  *     properties:
  *       name:
  *         type: string
  *       configurations:
  *         type: array
  *         items:
  *           $ref: "#/definitions/cf_configuration"
  *   cf_modules:
  *     description: "a list of modules configration"
  *     type: array
  *     items:
  *       $ref: "#/definitions/cf_module"
  *   cf_module_with_keys:
  *     description: "a JSON object containing a module to get modules configurations"
  *     properties:
  *       name:
  *         type: string
  *       keys:
  *         type: array
  *         items:
  *           $ref: "#/definitions/cf_key"
  */
