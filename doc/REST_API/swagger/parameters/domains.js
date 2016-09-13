/**
 * @swagger
 * parameter:
 *   dm_name:
 *     name: name
 *     in: body
 *     description: The domain name.
 *     required: true
 *     schema:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         company_name:
 *           type: string
 *   dm_company_name:
 *     name: company_name
 *     in: body
 *     description: The domain company name.
 *     required: true
 *     type: string
 *   dm_administrators:
 *     name: administrators
 *     in: body
 *     description: Array of domain administrators.
 *     required: true
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/us_content"
 *   dm_id:
 *     name: domain_id
 *     in: path
 *     description: The domain ID.
 *     required: true
 *     type: string
 *     format: uuid
 *   dm_adresses:
 *     name: adresses
 *     in: body
 *     description: Array of email addresses
 *     required: true
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/us_email"
 *   dm_user_ids:
 *    name: userIds
 *    in: body
 *    description: Array of user ID to promoted as domain administrators
 *    schema:
 *      type: array
 *      items:
 *        $ref: "#/definitions/us_id"
 *   dm_member:
 *     name: member
 *     in: body
 *     description: The member
 *     required: true
 *     schema:
 *       type: object
 *       properties:
 *        firstname:
 *          type: string
 *        lastname:
 *          type: string
 *        password:
 *         type: string
 *        account:
 *          $ref: "#/definitions/us_account"
 *        domains:
 *          type: array
 *          items:
 *            $ref: "#/definitions/cm_tuple_id"
 *        avatars:
 *          type: array
 *          items:
 *            $ref: "#/definitions/cm_uuid"
 *        job_title:
 *          type: string
 *        service:
 *          type: string
 *        building_location:
 *          type: string
 *        office_location:
 *          type: string
 *        main_phone:
 *          $ref: "#/definitions/us_phone"
 */
