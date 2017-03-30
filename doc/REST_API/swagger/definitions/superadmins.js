/**
  * @swagger
  * definition:
  *   sa_superadmin:
  *     description: "a JSON object containing a superadmin basic information"
  *     properties:
  *       name:
  *         type: string
  *       firstname:
  *         type: string
  *       lastname:
  *         type: string
  *       email:
  *         type: string
  *   sa_superadmins:
  *     description: "a list of superadmins"
  *     type: array
  *     items:
  *       $ref: "#/definitions/sa_superadmin"
  */
