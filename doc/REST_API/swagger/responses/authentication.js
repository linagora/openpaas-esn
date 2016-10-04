/**
  * @swagger
  * response:
  *   at_token:
  *     description: OK.  With the token object
  *     schema:
  *       $ref: "#/definitions/at_token"
  *     examples:
  *       application/json:
  *         {
  *           token: '132427377339939930',
  *           ttl: 60,
  *           user: '1234566789',
  *           created_at: '2014-05-16T09:47:11.703Z'
  *         }
  *   at_token_content:
  *     description: OK.  With the token object
  *     schema:
  *       $ref: "#/definitions/at_token"
  *     examples:
  *       application/json:
  *         {
  *           token: '132427377339939930',
  *           ttl: 60,
  *           user: '1234566789',
  *           created_at: '2014-05-16T09:47:11.703Z'
  *         }
  *   at_token_user:
  *     description: Ok. With the user object
  *     schema:
  *       $ref: "#/definitions/us_informations"
  *     examples:
  *       application/json:
  *         {
  *           _id: 123456789,
  *           firstname: "John",
  *           lastname: "Doe",
  *           emails: ["johndoe@linagora.com"]
  *         }
  */
