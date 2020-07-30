/**
 * @swagger
 * response:
 *  spa_list:
 *    description: Ok with the list of the applications and services.
 *    schema:
 *      type: array
 *      items:
 *        $ref: "#/definitions/spa_object"
 *    examples:
 *      application/json:
 *        [
 *          {
 *            id: 'calendar',
 *            type: 'UserApplication',
 *            icon: {
 *              type: 'image/png',
 *              data: 'dGVzdAo='
 *            },
 *            url: 'https://dev.open-paas.org/calendar/',
 *            name: {
 *              en: 'calendar',
 *              fr: 'calendrier'
 *            },
 *            weight: 30
 *          },
 *          {
 *            id: 'account',
 *            type: 'UserApplication',
 *            icon: {
 *              type: 'image/png',
 *              data: 'dGVzdAo='
 *            },
 *            url: 'https://dev.open-paas.org/account/',
 *            name: {
 *              en: 'account',
 *              fr: 'compte'
 *            },
 *            weight: 15
 *          }
 *        ]
 *  spa_object:
 *    description: OK with the SPA object
 *    schema:
 *      $ref: "#/definitions/spa_object"
 *    examples:
 *      application/json:
 *        {
 *          id: 'calendar',
 *          type: 'UserApplication',
 *          icon: {
 *            type: 'image/png',
 *            data: 'dGVzdAo='
 *          },
 *          url: 'https://dev.open-paas.org/calendar/',
 *          name: {
 *            en: 'calendar',
 *            fr: 'calendrier'
 *          },
 *          weight: 30
 *        }
 */
