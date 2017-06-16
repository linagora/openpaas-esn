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
  */
