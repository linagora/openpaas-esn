/**
  * @swagger
  * response:
  *   as_timeline:
  *     description: OK.
  *     schema:
  *       type: array
  *       items:
  *         $ref: '#/definitions/as_timeline_entry'
  *     examples:
  *       application/json:
  *         [
  *           {
  *             "_id": "57514f0fac66cee912e6fa11",
  *             "verb": “post”,
  *             "language": "en",
  *             "published": "2014-04-16T12:51:52.268Z",
  *             "actor": {
  *               "_id": "53579744ac7d77000003f660",
  *               "objectType": “user”,
  *               "id": “urn:linagora.com:user:53579744ac7d77000003f660”,
  *               "image": "58514110-cb27-11e3-9ecf-eda394093a53",
  *               "displayName": "Foo Bar"
  *             },
  *             "object": {
  *               "_id": "53579744ac7d77000003f777",
  *               "objectType": “whatsup”,
  *               "id": “urn:linagora.com:whatsup:53579744ac7d77000003f777”
  *             },
  *             "target": [
  *               {
  *                 "_id": "53579744ac7d77000003f888",
  *                 "objectType": “domain”,
  *                 "id": “urn:linagora.com:domain:53579744ac7d77000003f888”
  *               },
  *             ],
  *             "to": [
  *             ]
  *           }
  *         ]
  *   as_resource:
  *     description: |
  *       OK.
  *
  *       The resource associated to an activity stream.
  *
  *       For now it can only be a collaboration.
  *     schema:
  *       $ref: '#/definitions/as_resource'
  *     examples:
  *       application/json:
  *         {
  *           objectType: "community",
  *           object: {
  *             "_id": "123456789",
  *             "title": "Node.js",
  *             "description": "All about node.js",
  *             "creator": "0987654321",
  *             "domain_ids": ["83878920289838830309"],
  *             "timestamps": {
  *               "creation": "2014-05-16T09:47:11.703Z"
  *             },
  *           activity_stream: {
  *             uuid: "7389992882",
  *               "timestamps": {
  *                 "creation": "2014-05-16T09:47:11.704Z"
  *               }
  *             }
  *           }
  *         }
  *   as_unreadcount:
  *     description: |
  *       OK. Returns an object with :
  *
  *       _id: the activity stream uuid
  *
  *       unread_count: number of unread timeline entries'
  *     schema:
  *       description: Object with the number of unread timeline entries
  *       properties:
  *         "_id":
  *           type: string
  *           format: uuid
  *         "unread_count":
  *           type: integer
  *     examples:
  *       application/json:
  *         {
  *           "_id": "7389992882",
  *           "unread_count": 4
  *         }
  *   as_user:
  *     description: Get all the activity streams of the collaborations the current user can access.
  *     schema:
  *       type: array
  *       items:
  *         $ref: '#/definitions/as_current_user'
  *     examples:
  *       application/json:
  *         [
  *           {
  *             "uuid": "7aea8933-0a55-4e34-81ae-ec9812b8f891",
  *             "target": {
  *               "objectType": "domain",
  *               "displayName": "rse",
  *               "_id": "5375de4bd684db7f6fbd4f98",
  *               "id": "urn:linagora.com:domain:5375de4bd684db7f6fbd4f98",
  *               "image": ""
  *             }
  *           },
  *           {
  *             "uuid": "99363b89-b2d7-4eb7-872e-60c9909c5fb5",
  *             "target": {
  *               "objectType": "community",
  *               "displayName": "node.js",
  *               "_id": "53d76548974d22d21c9f249f",
  *               "id": "urn:linagora.com:community:53d76548974d22d21c9f249f",
  *               "image": "576875a0-1700-11e4-8141-013370dbdb36"
  *             }
  *           }
  *         ]
  *
  */
