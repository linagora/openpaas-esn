/**
 * @swagger
 * parameter:
 *   ppl_search_q:
 *     name: q
 *     description: Text to search in the people resources
 *     in: body
 *     required: false
 *     schema:
 *       type: string
 *   ppl_search_object_types:
 *     name: objectTypes
 *     description: Defines the resource to search people in. Resources are user, contact, group, ldap, etc. If not defined, search in all the available resources
 *     in: body
 *     required: false
 *     schema:
 *       $ref: "#/definitions/PeopleSearchRequestObjectTypes"
 *   ppl_search_limit:
 *     name: limit
 *     description: The maximum number of record for each resource to send back
 *     in: body
 *     required: false
 *     schema:
 *       type: integer
 *       example:
 *         30
 *   ppl_search_offset:
 *     name: offset
 *     description: The offset to start to search resources from
 *     in: body
 *     required: false
 *     schema:
 *       type: integer
 *       example:
 *         10
 *   ppl_search_query_q:
 *     name: q
 *     description: Text to search in the people resources
 *     in: query
 *     type: string
 *   ppl_search_excludes:
 *     name: excludes
 *     description: A list of tuple objects that are meant to be excluded from search
 *     in: body
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/Tuple"
 *   ppl_resolve_field_type:
 *     name: fieldType
 *     description: The name of the field to resolve people
 *     in: path
 *     required: true
 *     type: string
 *     enum:
 *       - emailaddress
 *   ppl_resolve_value:
 *     name: value
 *     description: The value to be resolved in a field
 *     in: path
 *     required: true
 *     type: string
 *   ppl_object_types_query:
 *     name: objectTypes
 *     description: The list of object types to find resolved person. The types must be separated by a comma (e.g user,contact,group)
 *     in: query
 *     required: false
 *     type: string
 */
