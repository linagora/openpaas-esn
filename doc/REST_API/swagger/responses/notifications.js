/**
  * @swagger
  * response:
  *   nt_notifications:
  *     description: OK.  With an array of user notifications.
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/nt_document"
  *     examples:
  *       application/json:
  *         [
  *           {
  *             "_id": '54327ab55489fe31a957c4b2',
  *             subject: { id: '54327ab55489fe31a957c4ae', objectType: 'user' },
  *             verb: { label: 'created', text: 'created' },
  *             complement: { id: 54327ab55489fe31a957c4af, objectType: 'community' },
  *             category: 'A category',
  *             acknowledged: false,
  *             read: false,
  *             target: [
  *               {
  *                 objectType: 'user',
  *                 id: '54327ab55489fe31a957c4aa'
  *               }
  *             ],
  *             action: "created",
  *             interactive: false,
  *             timestamps: { creation: '2014-10-06T11:19:17.035Z' }
  *           }
  *         ]
  *   nt_notifications_index:
  *     description: OK.  With an array of user notifications.
  *     headers:
  *       "X-ESN-Items-Count":
  *           description: The number of results for the request sent.
  *           type: integer
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/nt_document"
  *     examples:
  *       application/json:
  *         [
  *           {
  *             "_id": '54327ab55489fe31a957c4b2',
  *             subject: { id: '54327ab55489fe31a957c4ae', objectType: 'user' },
  *             verb: { label: 'created', text: 'created' },
  *             complement: { id: 54327ab55489fe31a957c4af, objectType: 'community' },
  *             category: 'A category',
  *             acknowledged: false,
  *             read: false,
  *             target: [
  *               {
  *                 objectType: 'user',
  *                 id: '54327ab55489fe31a957c4aa'
  *               }
  *             ],
  *             action: "created",
  *             interactive: false,
  *             timestamps: { creation: '2014-10-06T11:19:17.035Z' }
  *           }
  *         ]
  *   nt_notification:
  *     description: OK.  With the notification specified by the ids.
  *     schema:
  *       $ref: "#/definitions/nt_document"
  *     examples:
  *       application/json:
  *         {
  *           "_id": '54327ab55489fe31a957c4b2',
  *           subject: { id: '54327ab55489fe31a957c4ae', objectType: 'user' },
  *           verb: { label: 'created', text: 'created' },
  *           complement: { id: 54327ab55489fe31a957c4af, objectType: 'community' },
  *           category: 'A category',
  *           acknowledged: false,
  *           read: false,
  *           target: [
  *             {
  *               objectType: 'user',
  *               id: '54327ab55489fe31a957c4aa'
  *             }
  *           ],
  *           action: "created",
  *           interactive: false,
  *           timestamps: { creation: '2014-10-06T11:19:17.035Z' }
  *         }
  *   nt_create:
  *     description: Created. With the array of created notifications.
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/nt_document"
  *     examples:
  *       application/json:
  *        [
  *          {
  *            title: 'My notification',
  *            action: 'create',
  *            object: 'form',
  *            link: 'http://localhost:8888',
  *            author: 53a946c41f6d7a5d729e0477,
  *            _id: 53a946c41f6d7a5d729e047f,
  *            __v: 0,
  *            target: [ {objectType: 'user', id: 53a946c41f6d7a5d729e0478}, {objectType: 'user', id: 53a946c41f6d7a5d729e0479} ],
  *            read: false,
  *            timestamps: { creation: Tue Jun 24 2014 11:37:08 GMT+0200 (CEST) },
  *            level: 'info'
  *          },
  *          {
  *            parent: 53a946c41f6d7a5d729e047f,
  *            title: 'My notification',
  *            author: 53a946c41f6d7a5d729e0477,
  *            action: 'create',
  *            object: 'form',
  *            link: 'http://localhost:8888',
  *            _id: 53a946c41f6d7a5d729e0480,
  *            __v: 0,
  *            target: [ {objectType: 'user', id: 53a946c41f6d7a5d729e0478} ],
  *            read: false,
  *            timestamps: { creation: Tue Jun 24 2014 11:37:08 GMT+0200 (CEST) },
  *            level: 'info'
  *          },
  *          {
  *            parent: 53a946c41f6d7a5d729e047f,
  *            title: 'My notification',
  *            author: 53a946c41f6d7a5d729e0477,
  *            action: 'create',
  *            object: 'form',
  *            link: 'http://localhost:8888',
  *            _id: 53a946c41f6d7a5d729e0481,
  *            __v: 0,
  *            target: [ {objectType: 'user', id: 53a946c41f6d7a5d729e0479} ],
  *            read: false,
  *            timestamps: { creation: Tue Jun 24 2014 11:37:08 GMT+0200 (CEST) },
  *            level: 'info'
  *          }
  *        ]
  */
