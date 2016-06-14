/**
  * @swagger
  * definition:
  *   ct_community:
  *     properties:
  *       _id:
  *         $ref: "#/definitions/cm_tuple_id"
  *       title:
  *         type: string
  *       description:
  *         type: string
  *       domain_ids:
  *         type: array
  *         items:
  *           $ref: "#/definitions/cm_tuple_id"
  *       timestamps:
  *         $ref: "#/definitions/cm_timestamps"
  *       activity_stream:
  *         type: object
  *   ct_community_request:
  *     properties:
  *       _id:
  *         $ref: "#/definitions/cm_tuple_id"
  *       title:
  *         type: string
  *       description:
  *         type: string
  *       domain_ids:
  *         type: array
  *         items:
  *           $ref: "#/definitions/cm_tuple_id"
  *       timestamps:
  *         $ref: "#/definitions/cm_timestamps"
  *       activity_stream:
  *         type: object
  *       membershipRequest:
  *         $ref: "#/definitions/cm_date"
  */
