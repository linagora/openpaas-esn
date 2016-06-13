/**
  * @swagger
  * response:
  *   ct_communities:
  *     description: OK.  With an array of communities for the given domain.
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/ct_community"
  *     examples:
  *       application/json:
  *         [
  *           {
  *             "_id": "987654321",
  *             "title": "Mean",
  *             "description": "The Awesome MEAN stack",
  *             "domain_ids": ["8292903883939282"],
  *             "timestamps": {
  *               "creation": "2014-05-16T09:47:11.703Z"
  *             },
  *             activity_stream: {
  *               uuid: "9330-0393-7373-7280",
  *                 "timestamps": {
  *                 "creation": "2014-05-16T09:47:11.704Z"
  *                 }
  *               }
  *             },
  *             {
  *               "_id": "123456789",
  *               "title": "Node.js",
  *               "description": "All about node.js",
  *               "domain_ids": ["8292903883939282"],
  *               "timestamps": {
  *                 "creation": "2014-05-16T09:47:11.703Z"
  *               },
  *               activity_stream: {
  *                 uuid: "9330-0393-7373-7280",
  *                 "timestamps": {
  *                   "creation": "2014-05-16T09:47:11.704Z"
  *                 }
  *               }
  *             }
  *           ]
  *   ct_community:
  *     description: OK.  With the community object
  *     schema:
  *       $ref: "#/definitions/ct_community"
  *     examples:
  *       application/json:
  *         {
  *           "_id": "123456789",
  *           "title": "Node.js",
  *           "description": "All about node.js",
  *           "domain_ids": ["8292903883939282"],
  *           "timestamps": {
  *             "creation": "2014-05-16T09:47:11.703Z"
  *           },
  *           activity_stream: {
  *             uuid: "9330-0393-7373-7280",
  *             "timestamps": {
  *               "creation": "2014-05-16T09:47:11.704Z"
  *             }
  *           }
  *         }
  *   ct_error_conflict:
  *     description: Conflict. A community already exists with this title in the domain.
  *   ct_avatar:
  *     description: OK. With the recorded image ID
  *     schema:
  *       type: object
  *       properties:
  *         "_id":
  *           type: string
  *           format: uuid
  *     examples:
  *       application/json:
  *         {
  *           "_id": '9f888058-e9e6-4915-814b-935d5b88389d'
  *         }
  *   ct_member:
  *     description: OK - Current user is a community member and user is a member.
  *     schema:
  *       $ref: "#/definitions/us_member"
  *     examples:
  *       application/json:
  *         {
  *           "_id": "538e3bd6654d7c3307f990fb",
  *           "firstname": "John",
  *           "lastname": "Doe",
  *           "avatar": "9330-0393-7373-7280"
  *         }
  */
