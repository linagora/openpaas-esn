/**
  * @swagger
  * parameter:
  *   ct_community_id:
  *     name: community_id
  *     in: path
  *     description: The community ID
  *     required: true
  *     type: string
  *     format: uuid
  *   ct_domain_id:
  *     name: domain_id
  *     in: query
  *     description: The id of the domain to fetch communities from.
  *     required: true
  *     type: string
  *     format: uuid
  *   ct_type:
  *     name: type
  *     in: query
  *     description: The type of community.
  *     type: string
  *   ct_domain_ids:
  *     name: domain_ids
  *     in: query
  *     description: The ids of the domains the community is linked to
  *     required: true
  *     type: string
  *     format: uuid
  *   ct_creator:
  *     name: search_id
  *     in: query
  *     description: The id of the user who created the search communities.
  *     required: true
  *     type: string
  *     format: uuid
  *   ct_title_search:
  *     name: title_search
  *     in: query
  *     description: The title of a searched community. The title filter is case insensitive.
  *     required: true
  *     type: string
  *   ct_title:
  *     name: title
  *     in: query
  *     description: The community title
  *     required: true
  *     type: string
  *   ct_description:
  *     name: description
  *     in: query
  *     description: The community description
  *     required: true
  *     type: string
  *   ct_raw_data:
  *     name: raw_data
  *     in: body
  *     description: the raw file data.
  *     required: true
  *     schema:
  *       format: binary
  *   ct_noTitleCheck:
  *     name: noTitleCheck
  *     in: query
  *     description: optional parameter to skip the title check when creating a community
  *     required: false
  *     type: boolean
  *   cm_com_update:
  *     name: update
  *     in: body
  *     description: parameters to update in the community (title, avatar, newMembers, deleteMembers)
  *     required: true
  *     schema:
  *       type: object
  */
