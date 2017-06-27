/**
  * @swagger
  * parameter:
  *   cm_limit:
  *     name: limit
  *     in: query
  *     description: The number of results to return. This will only keep the N first results (where N=limit).
  *     required: false
  *     default: 50
  *     type: integer
  *   cm_offset:
  *     name: offset
  *     in: query
  *     description: |
  *       Start the list of results after skipping N results (where N=offset).
  *       For example, if the size of the results list is 100 and the offset is 50, the result list will contain only results from 50 to 99 (list index starts at index 0).
  *     required: false
  *     default: 0
  *     type: integer
  *   cm_search:
  *     name: search
  *     in: query
  *     description: |
  *       Search the people "firstname", "lastname" and "email" fields in case insensitive and accent agnostic way.
  *       Note that when there are more than one word in the search string (separated by one or more spaces), the search will become an AND.
  *       For example: 'search=foo bar' will search members where firstname, lastname and email contain foo AND bar.
  *     required: false
  *     type: string
  */
