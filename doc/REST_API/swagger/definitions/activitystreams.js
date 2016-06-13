/**
  * @swagger
  * definition:
  *   as_object:
  *     type: object
  *     properties:
  *       additionalProperties:
  *         $ref: "#/definitions/cm_tuple_and_its_urn"
  *       image:
  *         $ref: "#/definitions/cm_uuid"
  *       displayName:
  *         type: string
  *   as_timeline_entry:
  *     description: Describes a timeline entry for an activity stream
  *     properties:
  *       _id:
  *         $ref: "#/definitions/cm_tuple_id"
  *       verb:
  *         type: string
  *       language:
  *         type: string
  *       published:
  *         $ref: "#/definitions/cm_date"
  *       actor:
  *         $ref: "#/definitions/as_object"
  *       object:
  *         $ref: "#/definitions/cm_tuple_and_its_urn"
  *       target:
  *         type: array
  *         items:
  *           $ref: "#/definitions/cm_id_and_its_urn"
  *       inReplyTo:
  *         type: array
  *         items:
  *           $ref: "#/definitions/cm_id_and_its_urn"
  *       to:
  *         type: array
  *         items:
  *           $ref: "#/definitions/cm_op_tuple_properties"
  *       bto:
  *         type: array
  *         items:
  *           $ref: "#/definitions/cm_op_tuple_properties"
  *   as_resource:
  *     description: a resource associated to an activity stream.
  *     properties:
  *       objectType:
  *         type: string
  *       object:
  *         type: object
  *         properties:
  *           "_id":
  *             type: string
  *           "title":
  *             type: string
  *           "description":
  *             type: string
  *           "creator":
  *             $ref: "#/definitions/cm_tuple_id"
  *           "domain_ids":
  *             type: array
  *             items:
  *               $ref: "#/definitions/cm_tuple_id"
  *           "timestamps":
  *             $ref: "#/definitions/cm_timestamps"
  *           activity_stream:
  *             type: object
  *             properties:
  *               uuid:
  *                 $ref: "#/definitions/cm_uuid"
  *               "timestamps":
  *                 $ref: "#/definitions/cm_timestamps"
  *   as_current_user:
  *     description: activity streams object which can be read by the current user
  *     properties:
  *       uuid:
  *         $ref: "#/definitions/cm_uuid"
  *       target:
  *         $ref: "#/definitions/as_object"
  */
