/**
 * @swagger
 * response:
 *   ppl_search_response:
 *     description: Ok. With an array of matching people
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/People"
 *     examples:
 *       application/json:
 *         [
 *           {
 *             "id":"540da7521dadc2c713b377ac",
 *             "objectType":"user",
 *             "emailAddresses":[
 *               {
 *                 "value":"bruce.willis@open-paas.org",
 *                 "type":"default"
 *               }
 *             ],
 *             "names":[
 *               {
 *                 "displayName":"Bruce WILLIS",
 *                 "type":"default"
 *               }
 *             ],
 *             "photos":[
 *               {
 *                 "url":"https://open-paas.org/api/avatars?objectType=user&email=bruce.willis@open-paas.org",
 *                 "type":"default"
 *               }
 *             ]
 *           },
 *           {
 *             "id":"9cd024fe-ad01-4860-8edc-4559d313f8c6",
 *             "objectType":"contact",
 *             "emailAddresses":[
 *               {
 *                 "value":"me@brucewillis.com",
 *                 "type":"Work"
 *               }
 *             ],
 *             "names":[
 *               {
 *                 "displayName":"Bruce",
 *                 "type":"default"
 *               }
 *             ],
 *             "photos":[
 *               {
 *                 "url":"https://open-paas.org/contact/api/contacts/540da7521dadc2c713b377ac/contacts/9cd024fe-ad01-4860-8edc-4559d313f8c6/avatar",
 *                 "type":"default"
 *               }
 *             ]
 *           }
 *         ]
 */
