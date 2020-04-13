/**
  * @swagger
  * parameter:
  *   cl_search_type:
  *     name: search_type
  *     in: query
  *     description: The type of member to look for.
  *     required: true
  *     type: string
  *   cl_search_id:
  *     name: search_id
  *     in: query
  *     description: The id of the member to look for
  *     required: true
  *     type: string
  *     format: uuid
  *   cl_user_id:
  *     name: user_id
  *     in: path
  *     description: The id of the member to check
  *     required: true
  *     type: string
  *     format: uuid
  *   cl_invitable_object_type:
  *     name: object_type
  *     in: path
  *     description: For the moment, can only be 'community'
  *     required: true
  *     type: string
  *   cl_members_object_type:
  *     name: object_type
  *     in: path
  *     description: For the moment, can only be 'community' or 'project'
  *     required: true
  *     type: string
  *   cl_object_type_filter:
  *     name: object_type_filter
  *     in: query
  *     description: |
  *       Only show members of a certain object type, e.g. `user` or `community`.
  *       If prefixed with an exclamation mark, the object type query will be inverted.
  *     type: string
  *   cl_collaboration_id:
  *     name: collaboration_id
  *     in: path
  *     description: The id of the community
  *     required: true
  *     type: string
  *     format: uuid
  *   cl_object_id:
  *     name: id
  *     in: path
  *     description: The id of the community or the project (for the moment)
  *     required: true
  *     type: string
  *     format: uuid
  *   cl_invitable_limit:
  *     name: limit
  *     in: query
  *     description: The number of people to return. This will only keep the N first people (where N=limit).
  *     required: false
  *     default: 5
  *     type: integer
  *   cl_limit:
  *     name: limit
  *     in: query
  *     description: The number of results to return. This will only keep the N first results (where N=limit).
  *     required: false
  *     default: 50
  *     type: integer
  *   cl_offset:
  *     name: offset
  *     in: query
  *     description: |
  *       Start the list of results after skipping N results (where N=offset).
  *       For example, if the size of the results list is 100 and the offset is 50, the result list will contain only results from 50 to 99 (list index starts at index 0).
  *     required: false
  *     default: 0
  *     type: integer
  *   cl_search:
  *     name: search
  *     in: query
  *     description: |
  *       Search the people "firstname", "lastname" and "email" fields in case insensitive and accent agnostic way.
  *       Note that when there are more than one word in the search string (separated by one or more spaces), the search will become an AND.
  *       For example: 'search=foo bar' will search members where firstname, lastname and email contain foo AND bar.
  *     required: false
  *     type: string
  *   cl_withoutInvite:
  *     name: withoutInvite
  *     in: query
  *     description: Optional parameter which indicates if invitation workflow should be skipped when adding a member to a collaboration
  *     required: false
  *     default: false
  *     type: boolean
  */
