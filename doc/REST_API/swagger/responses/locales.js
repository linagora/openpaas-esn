/**
 * @swagger
 * response:
 *   lo_list:
 *     description: OK.  With an array of locales.
 *     schema:
 *       type: array
 *       items:
 *         type: string
 *     examples:
 *       application/json:
 *         [
 *             'en', 'fr'
 *         ]
 *   lo_current:
 *     description: OK.
 *     schema:
 *       type: object
 *     examples:
 *       application/json:
 *         {
 *           "key1": "value1",
 *           "key2": "value2"
 *         }
 *   lo_locale:
 *     description: OK.
 *     schema:
 *       type: object
 *     examples:
 *         {
 *           "key1": "value1",
 *           "key2": "value2"
 *         }
 */
