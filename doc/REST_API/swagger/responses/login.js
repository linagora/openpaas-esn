/**
 * @swagger
 * response:
 *   lg_authentication:
 *     description: Ok. With the user authenticated.
 *     schema:
 *       $ref: "#/definitions/us_def"
 *     examples:
 *       application/json:
 *         {
 *           "_id": "570bb87202073a453dc9b529",
 *           "firstname": "John0",
 *           "lastname": "Doe0",
 *           "__v": 1,
 *           "accounts": [
 *             {
 *               "type": "email",
 *               "timestamps": {
 *                 "creation": "2016-04-11T14:45:06.236Z"
 *                },
 *               "preferredEmailIndex": 0,
 *               "emails": [
 *                 "user0@open-paas.org"
 *               ],
 *               "hosted": false
 *             },
 *             {
 *               "type": "oauth",
 *               "data": {
 *                 "provider": "twitter",
 *                 "id": "2885409299",
 *                 "username": "pzachee1",
 *                 "display_name": "Zacheus",
 *                 "token": "2885409299-ZpGGKoG48CrorfVxaicuGscFL8z5FrvyV0TWOjj",
 *                 "token_secret": "kwe7r1wwcWcSQZLuG1hAxuNLteOnCfaOxX9CITBr7oxGQ"
 *               },
 *               "timestamps": {
 *                 "creation": "2016-04-11T15:37:33.272Z"
 *               },
 *               "preferredEmailIndex": 0,
 *               "emails": [],
 *               "hosted": false
 *             }
 *           ],
 *           "avatars": [],
 *           "schemaVersion": 2,
 *           "login": {
 *             "success": "2016-06-06T07:45:16.085Z",
 *             "failures": []
 *           },
 *           "domains": [
 *             {
 *               "domain_id": "570bb87202073a453dc9b519",
 *               "joined_at": "2016-04-11T14:45:06.475Z"
 *             }
 *           ],
 *           "timestamps": {
 *             "creation": "2016-04-11T14:45:06.235Z"
 *           }
 *         }
 */
