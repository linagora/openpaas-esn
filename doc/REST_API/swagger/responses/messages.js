/**
  * @swagger
  * response:
  *   msg_list:
  *     description: OK. At least one message is found.
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/msg_query_response"
  *     examples:
  *       application/json:
  *        [
  *          {
  *            objectType: "whatsup",
  *            _id: "53581bb1cca7800000522731",
  *            description: "I'm the content !",
  *            creator: 34556456,
  *            timestamps: {
  *              creation: 2354456547
  *            }
  *          },
  *          {
  *            objectType: "whatsup",
  *            _id: "53581bb1cca7800000522732",
  *            description: "I'm another content !",
  *            creator: 345564,
  *            timestamps: {
  *              creation: 23544564564
  *            }
  *          },
  *          {
  *            error: {
  *              status: 404,
  *              message: "Not Found",
  *              details: "The message 123 can not be found"
  *            }
  *          },
  *        ]
  *   msg_document:
  *     description: OK. With the message object.
  *     schema:
  *       $ref: "#/definitions/msg_document"
  *     examples:
  *       application/json:
  *         {
  *           objectType: "whatsup",
  *           _id: "53581bb1cca7800000522731",
  *           description: "I'm the content !",
  *           creator: 34556456,
  *           timestamps: {
  *             creation: 2354456547
  *           }
  *         }
  *   msg_create:
  *     description: Created. With the _id of the new message.
  *     schema:
  *       type: object
  *       required:
  *         - "_id"
  *       properties:
  *         "_id":
  *           $ref: "#/definitions/cm_uuid"
  *         parentId:
  *           $ref: "#/definitions/cm_uuid"
  *     examples:
  *       application/json:
  *         {
  *           _id: '7f281054-e7a6-1547-012f-935d5b88389d'
  *         }
  *   msg_vote:
  *     description: Ok. With the poll message updated.
  *     schema:
  *       $ref: "#/definitions/msg_document"
  *     examples:
  *       application/json:
  *         {
  *           "content": "choice message content",
  *           "author": "570bb87202073a453dc9b529",
  *           "__v": 1,
  *           "_id": "57514edbac66cee912e6fa0b",
  *           "parsers": [
  *             {
  *               "name": "markdown",
  *               "_id": "57514edbac66cee912e6fa0c"
  *             }
  *           ],
  *           "responses": [],
  *           "shares": [
  *             {
  *               "objectType": "activitystream",
  *               "id": "1416721f-c970-4c7f-9513-07db694dc7e2",
  *               "_id": "57514edbac66cee912e6fa0d"
  *             }
  *           ],
  *           "attachments": [],
  *           "source": "web",
  *           "timestamps": {
  *             "creation": "2016-06-03T09:33:15.592Z"
  *           },
  *           "pollResults": [
  *             {
  *               "vote": 1,
  *               "actor": {
  *                 "id": "570bb87202073a453dc9b529",
  *                 "objectType": "user"
  *               }
  *             }
  *           ],
  *           "pollChoices": [
  *             {
  *               "label": "one"
  *             },
  *             {
  *               "label": "two"
  *             }
  *           ],
  *           "objectType": "poll"
  *         }
  */
