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
  *        id:
  *          type: string
  *        type:
  *          type: string
  *          enum:
  *           - user
  *           - group
  *   davproxy_addressbook_update:
  *     name: addressbook
  *     in: body
  *     description: addressbook object to update
  *     required: true
  *     schema:
  *       type: object
  *       properties:
  *        name:
  *          type: string
  *        description:
  *          type: string
  *   davproxy_addressbook_destination:
  *     name: addressbook destination
  *     in: header
  *     description: addressbook destination to move
  *     required: true
  *     type: string
  *   davproxy_addressbook_book_name_query:
  *     name: bookName
  *     in: query
  *     description: ID of the address book
  *     required: false
  *     type: string
  *   davproxy_addressbook_personal:
  *     name: personal
  *     description: result returns personal address books of a book home
  *     in: query
  *     required: false
  *     type: boolean
  *   davproxy_addressbook_subscribed:
  *     name: subscribed
  *     description: result returns subscribed address books of a book home
  *     in: query
  *     required: false
  *     type: boolean
  *   davproxy_addressbook_shared:
  *     name: shared
  *     description: result returns shared address books of a book home
  *     in: query
  *     required: false
  *     type: boolean
  *   davproxy_addressbook_contacts_count:
  *     name: contactsCount
  *     description: result includes the number of contact in each address book
  *     in: query
  *     required: false
  *     type: boolean
  */
