/**
  * @swagger
  * parameter:
  *   davproxy_addressbook_book_home:
  *     name: bookHome
  *     in: path
  *     description: ID of the address book home (usually user ID)
  *     required: true
  *     type: string
  *   davproxy_addressbook_book_name:
  *     name: bookName
  *     in: path
  *     description: ID of the address book
  *     required: true
  *     type: string
  *   davproxy_addressbook_contact_id:
  *     name: contactId
  *     in: path
  *     description: ID of contact
  *     required: true
  *     type: string
  *   davproxy_addressbook_user_id:
  *     name: userId
  *     in: query
  *     description: ID of user
  *     required: true
  *     type: string
  *   davproxy_addressbook_contact:
  *     name: vcard
  *     in: body
  *     description: informations of contact want to update
  *     required: true
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/cm_id"
  *   davproxy_addressbook_create:
  *     name: addressbook
  *     in: body
  *     description: addressbook object to create
  *     required: true
  *     schema:
  *       type: object
  *       properties:
  *        name:
  *          type: string
  *        description:
  *          type: string
  *        type:
  *          type: string
  */
