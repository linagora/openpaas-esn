/**
  * @swagger
  * parameter:
  *   ldap_limit:
  *     name: limit
  *     in: query
  *     description: The number of results to return. This will only keep the N first results (where N=limit).
  *     required: false
  *     default: 50
  *     type: integer
  *   ldap_search:
  *     name: search
  *     in: query
  *     description: |
  *       Search the ldap's user fields in case insensitive and accent agnostic way.
  *     required: true
  *     type: string
**/
