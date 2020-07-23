/**
  * @swagger
  * definition:
  *   us_id:
  *     description: "a user ID"
  *     type: string
  *   us_email:
  *     description: "a string containing @ character"
  *     type: string
  *   us_phone:
  *     description: "a string describing the call number"
  *     type: string
  *   us_informations:
  *     properties:
  *       _id:
  *         type: string
  *         format: uuid
  *       firstname:
  *         type: string
  *       lastname:
  *         type: string
  *       emails:
  *         type: array
  *         items:
  *           $ref: "#/definitions/us_email"
  *   us_profile:
  *     properties:
  *       firstname:
  *         type: string
  *       lastname:
  *         type: string
  *       job_title:
  *         type: string
  *       service:
  *         type: string
  *       phone:
  *         $ref: "#/definitions/us_phone"
  *   us_member:
  *     properties:
  *       _id:
  *         type: string
  *         format: uuid
  *       firstname:
  *         type: string
  *       lastname:
  *         type: string
  *       avatar:
  *         type: string
  *         format: uuid
  *   us_content:
  *     properties:
  *       _id:
  *         type: string
  *         format: uuid
  *       firstname:
  *         type: string
  *       lastname:
  *         type: string
  *       preferredEmail:
  *         $ref: "#/definitions/us_email"
  *       emails:
  *         type: array
  *         items:
  *           $ref: "#/definitions/us_email"
  *       domains:
  *         type: array
  *         items:
  *           $ref: "#/definitions/cm_tuple_id"
  *       avatars:
  *         type: array
  *         items:
  *           $ref: "#/definitions/cm_uuid"
  *       job_title:
  *         type: string
  *       service:
  *         type: string
  *       building_location:
  *         type: string
  *       office_location:
  *         type: string
  *       main_phone:
  *         $ref: "#/definitions/us_phone"
  *   us_def:
  *     properties:
  *       additionalProperties:
  *         $ref: "#/definitions/us_content"
  *       "__v":
  *         type: integer
  *       schemaVersion:
  *         type: integer
  *       login:
  *         type: object
  *         properties:
  *           success:
  *             $ref: "#/definitions/cm_date"
  *           failures:
  *             type: array
  *             items:
  *               $ref: "#/definitions/cm_date"
  *   us_object:
  *     properties:
  *       _id:
  *         $ref: "#/definitions/cm_uuid"
  *       firstname:
  *         type: string
  *       lastname:
  *         type: string
  *       password:
  *         type: string
  *       account:
  *         $ref: "#/definitions/us_account"
  *       domains:
  *         type: array
  *         items:
  *           $ref: "#/definitions/cm_tuple_id"
  *       avatars:
  *         type: array
  *         items:
  *           $ref: "#/definitions/cm_uuid"
  *       job_title:
  *         type: string
  *       service:
  *         type: string
  *       building_location:
  *         type: string
  *       office_location:
  *         type: string
  *       main_phone:
  *         $ref: "#/definitions/us_phone"
  *   us_account:
  *     type: array
  *     items:
  *       type: object
  *       properties:
  *         type:
  *           type: string
  *           enum:
  *             - email
  *             - oauth
  *         preferredEmailIndex:
  *           type: number
  *         emails:
  *           type: array
  *           items:
  *             $ref: "#/definitions/us_email"
  *         hosted:
  *           type: boolean
  *   us_states:
  *     type: array
  *     items:
  *       type: object
  *       properties:
  *         name:
  *           type: string
  *           enum:
  *              - login
  *              - searchable
  *         value:
  *           type: string
  *           enum:
  *              - enabled
  *              - disabled
  */
