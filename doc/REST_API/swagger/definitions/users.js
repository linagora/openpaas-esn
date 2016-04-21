/**
 * @swagger
 * definition:
 *   Email:
 *     description: "a string containing @ character"
 *     type: string
 *   Phone:
 *     description: "a string describing the call number"
 *     type: string
 *   UserInformationResponse:
 *     properties:
 *       _id:
 *        type: string
 *       firstname:
 *         type: string
 *       lastname:
 *         type: string
 *       emails:
 *         type: array
 *         items:
 *           $ref: "#/definitions/Email"
 *   UserProfileResponse:
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
 *         $ref: "#/definitions/Phone"
 */
