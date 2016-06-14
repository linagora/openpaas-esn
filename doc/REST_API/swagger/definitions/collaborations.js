/**
  * @swagger
  * definition:
  *   cl_common_member:
  *     description: a common description for members of a collaboration
  *     properties:
  *           "_id":
  *             $ref: "#/definitions/cm_tuple_id"
  *           "currentAvatar":
  *             $ref: "#/definitions/cm_uuid"
  *           firstname:
  *             type: string
  *           lastname:
  *             type: string
  *           "job_title":
  *             type: string
  *           "domains":
  *             type: array
  *             items:
  *               type: object
  *               properties:
  *                 "domain_id":
  *                   $ref: "#/definitions/cm_tuple_id"
  *                 "joined_at":
  *                   $ref: "#/definitions/cm_date"
  *           "timestamps":
  *             $ref: "#/definitions/cm_timestamps"
  *           emails:
  *             type: array
  *             items:
  *               $ref: "#/definitions/us_email"
  *   cl_member:
  *     description: a member description for the collaboration
  *     properties:
  *       user:
  *         allOf:
  *           - $ref: "#/definitions/cl_common_member"
  *           - $ref: "#/definitions/cm_tuple"
  *   cl_member_request:
  *     description: a member description for requests
  *     properties:
  *       user:
  *         $ref: "#/definitions/cl_common_member"
  *       workflow:
  *         type: string
  *       "timestamps":
  *         $ref: "#/definitions/cm_timestamps"
  */
