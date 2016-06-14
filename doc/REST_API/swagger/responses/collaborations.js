/**
  * @swagger
  * response:
  *   cl_search:
  *     description: OK. With an array of collaborations where the given tuple is a member
  *     schema:
  *       type: array
  *       items:
  *         $ref: '#/definitions/as_resource'
  *     examples:
  *       application/json:
  *         [
  *           {
  *             "_id": "987654321",
  *             "title": "Mean Project",
  *             "description": "The Awesome MEAN stack project",
  *             "type": "project",
  *             "domain_ids": ["8292903883939282"],
  *             "timestamps": {
  *               "creation": "2014-05-16T09:47:11.703Z"
  *             },
  *             activity_stream: {
  *               "uuid": "9330-0393-7373-7280",
  *               "timestamps": {
  *                 "creation": "2014-05-16T09:47:11.704Z"
  *               }
  *             }
  *           },
  *           {
  *             "_id": "123456789",
  *             "title": "Node.js",
  *             "description": "All about node.js",
  *             "type": "project",
  *             "domain_ids": ["8292903883939282"],
  *             "timestamps": {
  *               "creation": "2014-05-16T09:47:11.703Z"
  *             },
  *             activity_stream: {
  *               "uuid": "9330-0393-7373-7280",
  *               "timestamps": {
  *                 "creation": "2014-05-16T09:47:11.704Z"
  *               }
  *             }
  *           }
  *         ]
  *   cl_writable:
  *     description: OK. With an array of collaborations where the given tuple has write permission
  *     schema:
  *       type: array
  *       items:
  *         $ref: '#/definitions/as_resource'
  *     examples:
  *       application/json:
  *         [
  *           {
  *             "_id": "987654321",
  *             "title": "Mean Project",
  *             "description": "The Awesome MEAN stack project",
  *             "type": "project",
  *             "domain_ids": ["8292903883939282"],
  *             "timestamps": {
  *               "creation": "2014-05-16T09:47:11.703Z"
  *             },
  *             activity_stream: {
  *               "uuid": "9330-0393-7373-7280",
  *               "timestamps": {
  *                 "creation": "2014-05-16T09:47:11.704Z"
  *               }
  *             }
  *           },
  *           {
  *             "_id": "123456789",
  *             "title": "Node.js",
  *             "description": "All about node.js",
  *             "type": "project",
  *             "domain_ids": ["8292903883939282"],
  *             "timestamps": {
  *               "creation": "2014-05-16T09:47:11.703Z"
  *             },
  *             activity_stream: {
  *               "uuid": "9330-0393-7373-7280",
  *               "timestamps": {
  *                 "creation": "2014-05-16T09:47:11.704Z"
  *               }
  *             }
  *           }
  *         ]
  *   cl_people:
  *     description: Ok. With the list of people.
  *     headers:
  *       "X-ESN-Items-Count":
  *           description: The number of results for the request sent.
  *           type: integer
  *     schema:
  *       type: array
  *       items:
  *         $ref: '#/definitions/us_informations'
  *     examples:
  *       application/json:
  *         [
  *           {
  *             _id: 123456789,
  *             firstname: "John",
  *             lastname: "Doe",
  *             emails: ["johndoe@linagora.com"]
  *           },
  *           {
  *             _id: 987654321,
  *             firstname: "Foo",
  *             lastname: "Bar",
  *             emails: ["foobar@linagora.com"]
  *           }
  *         ]
  *   cl_members:
  *     description: Ok. With an array of {objectType} members.
  *     headers:
  *       "X-ESN-Items-Count":
  *           description: The number of results for the request sent.
  *           type: integer
  *     schema:
  *       type: array
  *       items:
  *         $ref: '#/definitions/cl_member'
  *     examples:
  *       application/json:
  *         [
  *           {
  *             "user": {
  *               "_id": "5375de9fd684db7f6fbd5010",
  *               "currentAvatar": "5f9cef20-494c-11e4-a670-e32f9c5817b5",
  *               "firstname": "Bruce",
  *               "lastname": "Willis",
  *               "job_title": "Die Harder",
  *               "domains": [
  *                 {
  *                   "domain_id": "5375de4bd684db7f6fbd4f98",
  *                   "joined_at": "2014-05-16T09:47:11.732Z"
  *                 }
  *               ],
  *               "timestamps": {
  *                 "creation": "2014-05-16T09:47:11.703Z"
  *               },
  *               "emails": [
  *                 "bruce@willis.name"
  *               ]
  *             },
  *             "metadata": {
  *               "timestamps": {
  *                 "creation": "2014-09-16T20:16:51.449Z"
  *               }
  *             },
  *             "objectType": "user",
  *             "id": "5375de9fd684db7f6fbd5010"
  *           },
  *           {
  *             "user": {
  *               "_id": "5375de9fd684db7f6fbd5011",
  *               "currentAvatar": "5f9cef20-494c-11e4-a670-e32f9c5817b6",
  *               "firstname": "Karate",
  *               "lastname": "Kid",
  *               "job_title": "Foo Foo Fighter",
  *               "domains": [
  *                 {
  *                 "domain_id": "5375de4bd684db7f6fbd4f98",
  *                 "joined_at": "2014-05-16T10:47:11.732Z"
  *               }
  *               ],
  *               "timestamps": {
  *                 "creation": "2014-05-16T09:48:11.703Z"
  *               },
  *               "emails": [
  *                 "karatekid@savetheworld.com"
  *               ]
  *               },
  *               "metadata": {
  *                 "timestamps": {
  *                   "creation": "2014-09-16T20:17:51.449Z"
  *                 }
  *               },
  *               "objectType": "user",
  *               "id": "5375de9fd684db7f6fbd5011"
  *             },
  *             {
  *               "community": {
  *                 "_id": "5375de9fd684db7f6fbd5012",
  *                 "title": "Mu Awesome Community",
  *                 "domains": [
  *                   {
  *                   "domain_id": "5375de4bd684db7f6fbd4f98",
  *                   "joined_at": "2014-05-16T10:47:11.732Z"
  *                 }
  *               ],
  *               "timestamps": {
  *                 "creation": "2014-05-16T09:48:11.703Z"
  *               }
  *             },
  *             "metadata": {
  *               "timestamps": {
  *                 "creation": "2014-09-16T20:17:51.449Z"
  *               }
  *             },
  *             "objectType": "community",
  *             "id": "5375de9fd684db7f6fbd5012"
  *           }
  *         ]
  *   cl_is_member:
  *     description: Ok if the user defined by user_id is a member of the {objectType} collaboration of id {id}.
  *   cl_requests:
  *     description: Ok. With an array of membership requests with user information.
  *     schema:
  *       type: array
  *       items:
  *         $ref: '#/definitions/cl_member_request'
  *     examples:
  *       application/json:
  *         [
  *           {
  *             "user": {
  *               "_id": "5375de9fd684db7f6fbd5010",
  *               "currentAvatar": "5f9cef20-494c-11e4-a670-e32f9c5817b5",
  *               "firstname": "Bruce",
  *               "lastname": "Willis",
  *               "job_title": "Die Harder",
  *               "domains": [
  *                 {
  *                   "domain_id": "5375de4bd684db7f6fbd4f98",
  *                   "joined_at": "2014-05-16T09:47:11.732Z"
  *                 }
  *               ],
  *               "timestamps": {
  *                 "creation": "2014-05-16T09:47:11.703Z"
  *               },
  *               "emails": [
  *                 "bruce@willis.name"
  *               ]
  *             },
  *             "workflow": "request",
  *             "timestamps": {
  *                 creation: "2014-05-16T09:47:11.704Z"
  *             }
  *           }
  *         ]
  *   cl_membership_put:
  *     description: Ok. With the updated {objectType}.
  *     schema:
  *       $ref: '#/definitions/ct_community_request'
  *     examples:
  *       application/json:
  *         {
  *           "_id": "538e3bd6654d7c3307f990fa",
  *           "title": "Node.js",
  *           "description": "All about node.js",
  *           "domain_ids": ["9328938983983"],
  *           "timestamps": {
  *             "creation": "2014-05-16T09:47:11.703Z"
  *           },
  *           activity_stream: {
  *             uuid: "9330-0393-7373-7280",
  *             "timestamps": {
  *               "creation": "2014-05-16T09:47:11.704Z"
  *             }
  *           },
  *           membershipRequest: "2014-05-16T09:47:11.704Z"
  *         }
  */
