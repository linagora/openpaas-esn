/**
 * @swagger
 * definition:
 *   People:
 *     description: Definition of a people resource
 *     type: object
 *     properties:
 *       id:
 *         type: string
 *         description: id of the people in the platform
 *       objectType:
 *         type: string
 *         description: type of the people (user, contact, group, ldap, ...)
 *       emailAddresses:
 *         type: array
 *         description: Array of email addresses
 *         items:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               description: The email address
 *             type:
 *               type: string
 *               description: The type of email address (default, work, home, ...)
 *       names:
 *         type: array
 *         description: Array of displayable names
 *         items:
 *           type: object
 *           properties:
 *             displayName:
 *               type: string
 *               description: A 'displayable' name
 *             type:
 *               type: string
 *               description: The type of name (default, nickname, ...)
 *       photos:
 *         type: array
 *         description: Array of photos
 *         items:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               description: The URL of the photo. You can change the desired size by appending a query parameter size=size at the end of the url (not available for all resources).
 *             type:
 *               type: string
 *               description: The photo type (default, avatar, external, ...)
 *   PeopleSearchRequestObjectTypes:
 *     description: Defines the resource to search people in. If not defined, search in all the available resources
 *     type: array
 *     items:
 *       type: string
 *   PeopleSearchRequestPagination:
 *     type: object
 *     description: Defines the pagination for each resource type
 *     properties:
 *       limit:
 *         type: integer
 *         description: The maximum number of resources to send back
 *       offset:
 *         type: integer
 *         description: The offset to start to sarch resources from
 */
