/**
  * @swagger
  * definition:
  *   sa_platformadmin:
  *     description: "a JSON object containing a platformadmin basic information"
  *     properties:
  *       name:
  *         type: string
  *       firstname:
  *         type: string
  *       lastname:
  *         type: string
  *       email:
  *         type: string
  *   sa_platformadmins:
  *     description: "a list of platformadmins"
  *     type: array
  *     items:
  *       $ref: "#/definitions/sa_platformadmin"
  */
