/**
 * @swagger
 * response:
 *   dm_domain:
 *     description: Ok with the domain object.
 *     schema:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         company_name:
 *           type: string
 *     examples:
 *       application/json:
 *         {
 *           "name": "foo",
 *           "company_name": "bar"
 *         }
 *   dm_members:
 *     description: OK. With the list of members.
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/us_informations"
 *     headers:
 *       "X-ESN-Items-Count":
 *           description: The number of results for the request sent.
 *           type: integer
 *     examples:
 *       application/json:
 *         [
 *           {
 *             _id: 537e3db7654d7d592ef679e5,
 *             firstname: "John",
 *             lastname: "Doe",
 *             emails: ["johndoe@linagora.com"]
 *           },
 *           {
 *             _id: 537e3db7654d7d592ef679e6,
 *             firstname: "Foo",
 *            lastname: "Bar",
 *            emails: ["foobar@linagora.com"]
 *           },
 *         ]
 *   dm_invitations:
 *     description: Accepted. The request has been received and an invitation will be sent to each email of the list.
 *   dm_member:
 *     description: OK. With the member
 *     schema:
 *       $ref: "#/definitions/us_object"
 *     examples:
 *       application/json:
 *         {
 *           "_id": ObjectId("576c0d27b6c04ee64696b54d"),
 *           "firstname": "John0",
 *           "lastname": "Doe0",
 *           "password": "$2a$05$zjixZ79RIAcMnF5mxr4e.eavbJUGavfS/.kOZ2gZoCnMWgnisgLbW",
 *           "accounts": [
 *             {
 *               "type": "email",
 *               "timestamps": {
 *                 "creation": ISODate("2016-06-23T16:24:07.383Z")
 *               },
 *               "preferredEmailIndex": 0,
 *               "emails": [
 *                 "user0@open-paas.org"
 *               ],
 *               "hosted": false
 *             }
 *           ],
 *           "domains": [
 *             {
 *               "domain_id": ObjectId("576c0d26b6c04ee64696b53b"),
 *               "joined_at": ISODate("2016-06-23T16:24:07.804Z")
 *             }
 *           ]
 *        }
 *   dm_domains:
 *     description: Ok with the list domains object.
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/dm_domain"
 *     examples:
 *       application/json:
 *         [
 *           {
 *             "name": "foo",
 *             "company_name": "Foo",
 *             "timestamps": {
 *               "creation": ISODate("2016-06-23T16:24:07.383Z")
 *             }
 *           },
 *           {
 *             "name": "bar",
 *             "company_name": "Bar",
 *             "timestamps": {
 *               "creation": ISODate("2016-06-23T16:24:07.383Z")
 *             }
 *           }
 *         ]
 */
