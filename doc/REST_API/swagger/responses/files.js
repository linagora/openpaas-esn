/**
 * @swagger
 * response:
 *   fi_stream:
 *     description: OK. The file data will be streamed.
 *     schema:
 *       type: file
 *     headers:
 *       "Last-Modified":
 *           description: indicates the date and time at which the origin server believes the file was last modified.
 *           type: string
 *           format: date-time
 *     examples:
 *       text/plain:
 *         hello world
 *   fi_error_conflict:
 *     description: Conflict. File is used and can not be deleted.
 */
