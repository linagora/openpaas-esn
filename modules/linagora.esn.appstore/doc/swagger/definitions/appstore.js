/**
  * @swagger
  * definition:
  *   appstore_domain_injection:
  *     description: a domain injection
  *     type: string
  *   appstore_attribute:
  *     description: Describes an attribute entry of an application
  *     type: object
  *     properties:
  *       name:
  *         type: string
  *       value:
  *         type: string
  *       _id:
  *         $ref: "#/definitions/cm_id"
  *   appstore_attributes:
  *     type: array
  *     items:
  *       $ref: "#/definitions/appstore_attribute"
  *   appstore_value:
  *     description: Describes a value entry for an application
  *     type: object
  *     properties:
  *       directive:
  *         type: string
  *       _id:
  *         $ref: "#/definitions/cm_id"
  *       attributes:
  *         $ref: "#/definitions/appstore_attributes"
  *   appstore_values:
  *     type: array
  *     items:
  *       $ref: "#/definitions/appstore_value"
  *   appstore_target_injection:
  *     description: Describes an object target injection
  *     type: object
  *     properties:
  *       key:
  *         type: string
  *       values:
  *         $ref: "#/definitions/appstore_values"
  *   appstore_target_injections:
  *     type: array
  *     items:
  *       $ref: "#/definitions/appstore_target_injection"
  *   appstore_deployment:
  *     description: an object with details of deployment.
  *     type: object
  *     properties:
  *       target:
  *         $ref: "#/definitions/cm_tuple"
  *       version:
  *         type: string
  *       timestamps:
  *         $ref: "#/definitions/cm_timestamps"
  *       installs:
  *         $ref: "#/definitions/cm_tuple"
  *       state:
  *         type: string
  *   appstore_deployments:
  *     type: array
  *     items:
  *       $ref: "#/definitions/appstore_deployment"
  *   appstore_artifact:
  *     description: an object in artifacts
  *     type: object
  *     properties:
  *       id:
  *         $ref: "#/definitions/cm_id"
  *       version:
  *         type: string
  *       timestamps:
  *         $ref: "#/definitions/cm_timestamps"
  *   appstore_artifacts:
  *     type: array
  *     items:
  *       $ref: "#/definitions/appstore_artifact"
  *   appstore_app:
  *     description: Describes an application
  *     properties:
  *       _id:
  *         $ref: "#/definitions/cm_id"
  *       title:
  *         type: string
  *       version:
  *         type: string
  *       description:
  *         type: string
  *       installed:
  *         type: boolean
  *       update:
  *         type: boolean
  *   appstore_app_detail:
  *     description: Details of an application
  *     properties:
  *       _id:
  *         $ref: "#/definitions/cm_id"
  *       avatar:
  *         type: string
  *       title:
  *         type: string
  *       description:
  *         type: string
  *       __v:
  *         type: string
  *       schemaVersion:
  *         type: string
  *       targetInjections:
  *         type: array
  *         items:
  *           $ref: "#/definitions/appstore_target_injections"
  *       domainInjections:
  *         type: array
  *         items:
  *           $ref: "#/definitions/appstore_domain_injection"
  *       timestamps:
  *         $ref: "#/definitions/cm_timestamps"
  *       deployments:
  *         type: array
  *         items:
  *           $ref: "#/definitions/appstore_deployments"
  *       artifacts:
  *         type: array
  *         items:
  *           $ref: "#/definitions/appstore_artifacts"
  *   appstore_tuple:
  *     description: a tuple request body
  *     properties:
  *       target:
  *         $ref: "#/definitions/cm_tuple"
  *       version:
  *         type: string
  *   appstore_application:
  *     description: basic informations of a new application
  *     properties:
  *       title:
  *         type: string
  *       description:
  *         type: string
  */
