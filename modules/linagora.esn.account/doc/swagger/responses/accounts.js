/**
  * @swagger
  * response:
  *   accounts_list:
  *     description: OK. With a list of user accounts
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/us_account"
  *     examples:
  *       application/json:
  *         [
  *          {
  *            "type": "oauth",
  *            "data": {
  *              "provider": "twitter",
  *              "id": "13024132",
  *              "username": "chamerling",
  *              "display_name": "Christophe Hamerling",
  *              "token": "13024132-o8Sr2ybj0ve4U0mPpxW7",
  *              "token_secret": "XRCOXgzqAjyu5Qfsx9c6v2c"
  *            },
  *            "timestamps": {
  *              "creation": "2015-10-08T14:56:15.315Z"
  *            },
  *            "preferredEmailIndex": 0,
  *            "emails": [],
  *            "hosted": false
  *           }
  *         ]
  */
