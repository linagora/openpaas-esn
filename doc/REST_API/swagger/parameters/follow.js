/**
 * @swagger
 * parameter:
 *   fl_limit:
 *     name: limit
 *     in: query
 *     description: The maximum number of users to include in the response.
 *     required: false
 *     type: integer
 *   fl_offset:
 *     name: offset
 *     in: query
 *     description: Start the list of results after skipping N results (where N=offset).
 *     required: false
 *     default: 0
 *     type: integer
 *   fl_id:
 *     name: id
 *     in: path
 *     description: The id of the user to fetch follow data.
 *     type: string
 *     required: true
 *   fl_tid:
 *     name: tid
 *     in: path
 *     description: The id of the user to follow/unfollow.
 *     required: true
 *     type: string
 */
