/**
  * @swagger
  * definition:
  *   Profile:
  *     description: "a JSON object containing a profile properties values"
  *     properties:
  *       firstname:
  *         type: string
  *       lastname:
  *         type: string
  *       job_title:
  *         type: string
  *       service:
  *         type: string
  *       building_location:
  *         type: string
  *       main_phone:
  *         type: string
  *       office_location:
  *         type: string
  *       description:
  *         type: string
  *   cm_value:
  *     description: "defines a JSON object containing a value property"
  *     properties:
  *       value:
  *         type: string
  *   cm_tuple_id:
  *     description: "defines a tuple identifier (12/24 hex length)"
  *     type: string
  *   cm_uuid:
  *     description: "defines a universal unique identifier (32/8-4-4-4-12 length)"
  *     type: string
  *     format: uuid
  *   cm_id:
  *     description: "defines either a uuid or a tuple id"
  *     type: string
  *   cm_tuple:
  *     description: "defines a tuple"
  *     properties:
  *       id:
  *         type: string
  *       objectType:
  *         type: string
  *   cm_tuple_properties:
  *     description: "properties that define a tuple in a document"
  *     properties:
  *       _id:
  *         type: string
  *       objectType:
  *         type: string
  *   cm_op_tuple_properties:
  *     description: "properties that define a tuple in a document"
  *     properties:
  *       id:
  *         type: string
  *       objectType:
  *         type: string
  *   cm_urn_object:
  *     description: "defines a urn as urn:object type:object id"
  *     type: object
  *     properties:
  *       id:
  *         type: string
  *   cm_tuple_and_its_urn:
  *     description: "defined from both its tuple and the according urn"
  *     allOf:
  *       - $ref: "#/definitions/cm_tuple_properties"
  *       - $ref: "#/definitions/cm_urn_object"
  *   cm_id_and_its_urn:
  *     description: "defined from both its tuple and the according urn"
  *     properties:
  *       id:
  *         $ref: "#/definitions/cm_id"
  *       additionalProperties:
  *         $ref: "#/definitions/cm_urn_object"
  *   cm_date:
  *     type: string
  *     format: date-time
  *   cm_timestamps:
  *     description: "defines an object containing a creation date"
  *     type: object
  *     properties:
  *       "creation":
  *         type: string
  *         format: date-time
  *   cm_document:
  *     description: properties returned when a document has been created.
  *     properties:
  *       _id:
  *         $ref: "#/definitions/cm_tuple_id"
  *       __v:
  *         type: integer
  *       schemaVersion:
  *         type: integer
  *       created:
  *         $ref: "#/definitions/cm_date"
  */
