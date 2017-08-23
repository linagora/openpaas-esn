/**
  * @swagger
  * response:
  *   user.status_user_status:
  *     description: OK. With status of user
  *     schema:
  *       $ref: "#/definitions/user.status_user_status"
  *     examples:
  *       application/json:
  *         {
  *           _id: "584abaa9e2d7d7686cff340f",
  *           status: "disconnected",
  *           last_active: "2017-08-23T06:21:39.092Z"
  *         }
  *   user.status_users_status:
  *     description: OK. With status of multiple users
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/user.status_user_status"
  *     examples:
  *       application/json:
  *         [
  *           {
  *             _id: "584abaa9e2d7d7686cff340f",
  *             status: "disconnected",
  *             last_active: "2017-08-23T06:21:39.092Z"
  *           },
  *           {
  *             _id: "589d972889e03e31beef10b6",
  *             status: "connected",
  *             last_active: "2017-08-28T06:21:39.092Z"
  *           }
  *         ]
  */
