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
 */
