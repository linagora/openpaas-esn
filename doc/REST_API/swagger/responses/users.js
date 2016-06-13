/**
  * @swagger
  * response:
  *   uss_profile:
  *     description: OK.  With the user object
  *     schema:
  *       $ref: "#/definitions/us_content"
  *     examples:
  *       application/json:
  *         {
  *           "_id": "570bb87202073a453dc9b529",
  *           "firstname": "John0",
  *           "lastname": "Doe0",
  *           "preferredEmail": "user0@open-paas.org",
  *           "emails": [
  *             "user0@open-paas.org"
  *           ],
  *           "domains": [
  *             {
  *               "domain_id": "570bb87202073a453dc9b519",
  *               "joined_at": "2016-04-11T14:45:06.475Z"
  *             }
  *           ],
  *           "avatars": []
  *         }
  *   uss_avatar:
  *     description: OK. With the stream of the avatar if found or a default avatar.
  *     headers:
  *       "Last-Modified":
  *         description: indicates the date and time at which the origin server believes the avatar was last modified.
  *         type: string
  *         format: date-time
  *     schema:
  *       type: file
  */
