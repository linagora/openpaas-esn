/**
 * @swagger
 * response:
 *   ldap_uss_content:
 *     description: Ok with the list of users.
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/ldap_us_content"
 *     examples:
 *       application/json:
 *        [
 *          {
 *            "firstname": "John",
 *            "lastname": "Doe",
 *            "job_title": "Manager",
 *            "service": "Sales",
 *            "main_phone": "+33467455653222"
 *          }
 *        ]
**/
