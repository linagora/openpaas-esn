/**
  * @swagger
  * response:
  *   us_unread:
  *     description: OK.  With the number of unread user notifications.
  *     schema:
  *       type: object
  *       properties:
  *         "unread_count":
  *           type: integer
  *     examples:
  *       application/json:
  *         {
  *           "unread_count": 42
  *         }
  *   us_informations:
  *     description: Ok. With the authenticated user informations
  *     schema:
  *       $ref: "#/definitions/us_informations"
  *     examples:
  *       application/json:
  *         {
  *           _id: 123456789,
  *           firstname: "John",
  *           lastname: "Doe",
  *           emails: [
  *             "johndoe@linagora.com"
  *           ]
  *         }
  *   us_profile:
  *     description: Success
  *     schema:
  *       $ref: "#/definitions/us_profile"
  *     examples:
  *       application/json:
  *         {
  *           "firstname": "John",
  *           "lastname": "Doe",
  *           "job_title": "Manager",
  *           "service": "Sales",
  *           "phone": "+33467455653222"
  *         }
  *   us_update_profile:
  *     description: Success. The profile element has been updated.
  *     examples:
  *       application/json:
  *         {
  *           firstname: "John",
  *           lastname: "Doe",
  *           job_title: "Manager",
  *           service: "Sales",
  *           phone: "+33467455653222"
  *         }
  *   us_oauth_clients:
  *     description: Success. An array of OAuth clients the current user created.
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/oauth_document"
  *     examples:
  *       application/json:
  *         [
  *           {
  *             "_id":"54189f0c5375449a5d17f3d9",
  *             "clientSecret":"OwISwURuiJ1KhBgRIgPdQNbMzyIpA9AEyuHTCRQH",
  *             "clientId":"t0m0s3SS1cDLEVBK7pvL",
  *             "name":"Twitter Streaming App",
  *             "redirectUri":"http://twitter.com/oauth/",
  *             "description":"Let's stream tweets",
  *             "creator":"5375de9fd684db7f6fbd5010",
  *             "__v":0,
  *             "schemaVersion":1,
  *             "created":"2014-09-16T20:35:24.643Z"
  *           }
  *         ]
  */
