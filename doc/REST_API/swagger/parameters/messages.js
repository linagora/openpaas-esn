/**
 * @swagger
 * parameter:
 *   msg_id:
 *     name: id
 *     in: path
 *     description: the message id
 *     type: string
 *     format: uuid
 *     required: true
 *   msg_id_query:
 *     name: id
 *     in: query
 *     description: the message id
 *     type: string
 *     format: uuid
 *     required: true
 *   msg_ids:
 *     name: ids
 *     in: query
 *     description: Identifiers of the messages to fetch.
 *     type: array
 *     items:
 *       type: string
 *       format: uuid
 *     required: true
 *   msg_objectType:
 *     name: objectType
 *     in: query
 *     description: type of the target
 *     type: string
 *     required: true
 *   msg_vote:
 *     name: vote
 *     in: path
 *     description: vote value
 *     type: integer
 *     required: true
 *   msg_message:
 *     name: message
 *     in: body
 *     description: message description
 *     required: true
 *     schema:
 *       $ref: "#/definitions/msg_message"
 *   msg_mail:
 *     name: mail
 *     in: body
 *     description: An email in rfc822 MIME format.
 *     required: true
 *     schema:
 *       type: string
 *   msg_share:
 *     name: share
 *     in: body
 *     description: identify the source community/project of the original message and the targets where the message will be copied
 *     required: true
 *     schema:
 *       type: object
 *       properties:
 *         resource:
 *           $ref: "#/definitions/msg_resource"
 *         targets:
 *           $ref: "#/definitions/msg_targets"
 */
