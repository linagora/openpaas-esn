/**
  * @swagger
  * parameter:
  *   contact_address_book_id:
  *     name: addressBookId
  *     in: path
  *     description: The address book ID of user.
  *     required: true
  *     type: string
  *   contact_address_book_name:
  *     name: addressbookName
  *     in: path
  *     description: The address book name of user.
  *     required: true
  *     type: string
  *   contact_id:
  *     name: contactId
  *     in: path
  *     description: The contact ID, color of letter avatar will be based on this ID.
  *     required: true
  *     type: string
  *   contact_size:
  *     name: size
  *     in: query
  *     description: Size of the default avatar generated from user information, default value is 256 pixels.
  *       In case the avatar is provided by user, this query has no effect.
  *     required: false
  *     default: 256
  *     type: integer
  *   contact_user_id:
  *     name: userId
  *     in: query
  *     description: ID of user
  *     required: true
  *     type: string
  */
