/**
 * @swagger
 * parameter:
 *   dm_name:
 *     name: name
 *     in: body
 *     description: The domain name.
 *     required: true
 *     schema:
 *      type: string
 *   dm_name_filter:
 *     name: name
 *     in: query
 *     description: The domain name which is used to filter the domain by name.
 *     type: string
 *   dm_hostname_filter:
 *     name: hostname
 *     in: query
 *     description: The hostname which is used to filter the domain by hostname.
 *     type: string
 *   dm_company_name:
 *     name: company_name
 *     in: body
 *     description: The domain company name.
 *     schema:
 *      type: string
 *   dm_hostnames:
 *     name: hostnames
 *     in: body
 *     description: Array of domain hostnames.
 *     schema:
 *       type: array
 *       items:
 *         type: string
 *   dm_administrator:
 *     name: administrator
 *     in: body
 *     description: Domain administrator.
 *     required: true
 *     schema:
 *       type: object
 *       required: [email, password]
 *       properties:
 *        email:
 *          type: string
 *        password:
 *          type: string
 *   dm_id:
 *     name: domain_id
 *     in: path
 *     description: The domain ID.
 *     required: true
 *     type: string
 *     format: uuid
 *   dm_administrator_id:
 *    name: administrator_id
 *    in: path
 *    description: The administrator ID
 *    required: true
 *    type: string
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
