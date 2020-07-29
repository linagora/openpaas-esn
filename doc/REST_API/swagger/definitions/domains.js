/**
  * @swagger
  * definition:
  *   dm_domain:
  *     description: domain object
  *     type: object
  *     properties:
  *       id:
  *         type: string
  *       name:
  *         type: string
  *       company_name:
  *         type: string
  *       timestamps:
  *         $ref: "#/definitions/cm_timestamps"
  *
  *   dm_domain_create:
  *      type: object
  *      required: [name, administrator]
  *      properties:
  *        name:
  *          type: string
  *        company_name:
  *          type: string
  *        hostnames:
  *          type: array
  *          items:
  *            type: string
  *        administrator:
  *          type: object
  *          required: [email, password]
  *          properties:
  *           email:
  *             type: string
  *           password:
  *             type: string
  */
