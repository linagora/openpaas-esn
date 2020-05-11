/**
 * @swagger
 * parameter:
 *   hc_cause:
 *     name: cause
 *     in: query
 *     description: Decide whether or not returns cause field. If set to true, user must be platform admin
 *     required: false
 *     type: boolean
 *   hc_services:
 *     name: services
 *     in: query
 *     description: Lists of services name to get health check status for, separated by comma. If unset, returns all.
 *     required: false
 *     type: string
 */
