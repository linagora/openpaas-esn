/**
 * @swagger
 * parameter:
 *   nt_read:
 *     name: read
 *     in: query
 *     description: |
 *       If true, show notifications marked as read.
 *
 *       If false, show only unread ones.
 *
 *       If all, show all.
 *
 *     type: string
 *     required: false
 *     default: "all"
 *   nt_id:
 *     name: id
 *     in: path
 *     description: the  notification id
 *     type: string
 *     required: true
 *   nt_ids:
 *     name: ids
 *     in: query
 *     description: a list of notification ids
 *     type: array
 *     items:
 *       type: string
 *     collectionFormat: multi
 *     required: true
 *   nt_value:
 *     name: value
 *     in: body
 *     description: the value to apply to the property of each notification
 *     schema:
 *       type: boolean
 *     required: true
 *   nt_notification:
 *     name: notification
 *     in: body
 *     description: notification description
 *     required: true
 *     schema:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         action:
 *           type: string
 *         object:
 *           type: string
 *         link:
 *           type: string
 *         author:
 *           type: string
 *           format: uuid
 *         target:
 *           type: array
 *           items:
 *             $ref: "#/definitions/cm_tuple"
 *         read:
 *           type: boolean
 *         timestamps:
 *           $ref: "#/definitions/cm_timestamps"
 *         level:
 *           type: string
 */
