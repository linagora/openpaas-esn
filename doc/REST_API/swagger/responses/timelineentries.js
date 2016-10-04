/**
 * @swagger
 * response:
 *   tl_entry:
 *     description: Ok. With an array of timeline entries
 *     headers:
 *       "X-ESN-Items-Count":
 *         description: The total number of items which fulfill the query.
 *         type: integer
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/TimelineEntry"
 *     examples:
 *       application/json:
 *         [
 *           {
 *             "_id":"5763d402482e3d98c20927af",
 *             "verb":"post",
 *             "language":"",
 *             "__v":0,
 *             "bto":[
 *             ],
 *             "to":[
 *             ],
 *             "inReplyTo":[
 *             ],
 *             "target":[
 *               {
 *                 "objectType":"activitystream",
 *                 "_id":"9a41b775-309c-4dcc-a459-5308394e76ee"
 *               }
 *             ],
 *             "object":{
 *               "objectType":"whatsup",
 *               "_id":"5763d401482e3d98c20927ab"
 *             },
 *             "actor":{
 *               "objectType":"user",
 *               "_id":"56fe763daeac3a67056d8084",
 *               "image":"5710be7735a7fd3e29abeb9d",
 *               "displayName":"Christophe Hamerling"
 *             },
 *             "published":"2016-06-17T10:42:09.992Z"
 *           },
 *           {
 *             "_id":"5763d401482e3d98c20927ad",
 *             "verb":"post",
 *             "language":"",
 *             "__v":0,
 *             "bto":[
 *             ],
 *             "to":[
 *             ],
 *             "inReplyTo":[
 *             ],
 *             "target":[
 *               {
 *                 "objectType":"activitystream",
 *                 "_id":"9a41b775-309c-4dcc-a459-5308394e76ee"
 *               }
 *             ],
 *             "object":{
 *               "objectType":"whatsup",
 *               "_id":"5763d401482e3d98c20927a9"
 *             },
 *             "actor":{
 *               "objectType":"user",
 *               "_id":"56fe763daeac3a67056d8084",
 *               "image":"5710be7735a7fd3e29abeb9d",
 *               "displayName":"Christophe Hamerling"
 *             },
 *             "published":"2016-06-17T10:42:09.924Z"
 *           }
 *         ]
 */