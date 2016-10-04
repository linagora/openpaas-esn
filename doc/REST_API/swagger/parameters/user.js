/**
 * @swagger
 * parameter:
 *   us_attribute_name:
 *     name: attribute_name
 *     in: path
 *     description: The attribute name of the element to update (firstname, lastname, ...)
 *     required: true
 *     type: string
 *     enum:
 *       - firstname
 *       - lastname
 *       - job_title
 *       - service
 *       - phone
 *   us_attribute_value:
 *     name: attribute_value
 *     in: body
 *     schema:
 *       $ref: "#/definitions/cm_value"
 *     description: The attribute value of the element to update
 *     required: true
 */
