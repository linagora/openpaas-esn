/**
 * @swagger
 * parameter:
 *   sa_set_type:
 *     name: type
 *     in: body
 *     description: Type of the data to set platformadmin
 *     required: true
 *     schema:
 *       type: string
 *       enum:
 *         - id
 *         - email
 *   sa_set_data:
 *     name: data
 *     in: body
 *     description: User ID or email of the user you want to set as platformadmin
 *     required: true
 *     schema:
 *       type: string
 *   sa_unset_type:
 *     name: type
 *     in: body
 *     description: Type of the data to unset platformadmin
 *     required: true
 *     schema:
 *       type: string
 *       enum:
 *         - id
 *         - email
 *   sa_unset_data:
 *     name: data
 *     in: body
 *     description: User ID or email of the platformadmin you want to unset
 *     required: true
 *     schema:
 *       type: string
 */
