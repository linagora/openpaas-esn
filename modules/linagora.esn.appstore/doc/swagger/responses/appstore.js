/**
  * @swagger
  * response:
  *   appstore_apps:
  *     description: OK. With the list of applications
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/appstore_app"
  *     examples:
  *       application/json:
  *         [
  *           {
  *             "_id": "537efb2a078e20a54b21332d",
  *             "title": "Twitter",
  *             "version": "0.1",
  *             "description": "Send tweets from you activity stream",
  *             "installed": true,
  *             "update": true
  *           },
  *           {
  *             "_id": "537efb2a078e20a54b213333",
  *             "title": "Chat",
  *             "version": "1.0",
  *             "description": "Live chat in the community",
  *             "installed": true,
  *             "update": false
  *           },
  *           {
  *             "_id": "637efb2a078e20a54b213234",
  *             "title": "Doodle",
  *             "version": "0.9.1",
  *             "description": "Create Doodle in the community",
  *             "installed": false,
  *             "update": false
  *           },
  *         ]
  *   appstore_app:
  *     description: OK. With the community application
  *     schema:
  *       $ref: "#/definitions/appstore_app_detail"
  *     examples:
  *       application/json:
  *          {
  *            "_id":"54896f28c89cae000038b8f8",
  *            "avatar":"",
  *            "title":"New Application",
  *            "description":"a pretty description",
  *            "__v":3,
  *            "schemaVersion":1,
  *            "targetInjections":[
  *              {
  *                "key":"communityPageRightPanel",
  *                "values":[
  *                  {
  *                    "directive":"albi-modeler-link",
  *                    "_id":"54896f28c89cae000038b8f9",
  *                    "attributes":[
  *                      {
  *                        "name":"community",
  *                        "value":"community",
  *                        "_id":"54896f28c89cae000038b8fa"
  *                      }
  *                    ]
  *                  }
  *                ]
  *              }
  *            ],
  *            "domainInjections":[ ],
  *            "timestamps":{
  *              "creation":"2014-12-11T10:17:12.801Z"
  *            },
  *            "deployments":[
  *              {
  *                "target":{
  *                  "objectType":"domain",
  *                  "id":"54857e68eca9bfe373b76790"
  *                },
  *                "version":"1.0.0",
  *                "timestamps":{
  *                  "creation":"2014-12-11T10:17:38.021Z"
  *                },
  *                "installs":[
  *                  {
  *                    "objectType":"community",
  *                    "id":"54896eedc89cae000038b8f6"
  *                  }
  *                ],
  *                "state":"submit"
  *              }
  *            ],
  *            "artifacts":[
  *              {
  *                "id":"df9a7080-811e-11e4-9e1b-e7a0d5819c5c",
  *                "version":"1.0.0",
  *                "timestamps":{
  *                  "creation":"2014-12-11T10:17:12.981Z"
  *                 }
  *              }
  *            ]
  *          }
  *   appstore_created_app:
  *     description: Created. The application has been created.
  *     schema:
  *       type: object
  *       properties:
  *         _id:
  *           $ref: "#/definitions/cm_id"
  *     examples:
  *       application/json:
  *         {
  *           "_id": "637efb2a078e20a54b213234"
  *         }
  *   appstore_created_avatar:
  *     description: Created. With the recorded image ID
  *     schema:
  *       type: object
  *       properties:
  *         _id:
  *           $ref: "#/definitions/cm_id"
  *     examples:
  *       application/json:
  *         {
  *           "_id": "9f888058-e9e6-4915-814b-935d5b88389d"
  *         }
  */
