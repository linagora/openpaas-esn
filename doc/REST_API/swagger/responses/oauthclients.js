/**
  * @swagger
  * response:
  *   oauth_list:
  *     description: OK. With an array of client oauth applications.
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/oauth_document"
  *     examples:
  *       application/json:
  *         [
  *           {
  *             "_id": "575185dfac66cee912e6fa14",
  *             "clientSecret": "2g4202xyYKy7v60j9xa5WkprzGvvkh9f8yltAVTa",
  *             "clientId": "3vsB8opK4PX5mmtxrsD7",
  *             "name": "app1",
  *             "redirectUri": "http://www.mydomain.com/app",
  *             "description": "a first description",
  *             "creator": "570bb87202073a453dc9b529",
  *             "__v": 0,
  *             "schemaVersion": 1,
  *             "created": "2016-06-03T13:27:59.531Z"
  *           },
  *           {
  *             "_id": "5751834cac66cee912e6fa13",
  *             "clientSecret": "GInS3NruSjtET7C4MRfaEDz8vSLKErXJzpifJSxH",
  *             "clientId": "LHHYavlKfKt97pZppGwM",
  *             "name": "app2",
  *             "redirectUri": "http://www.mydomain.com/company",
  *             "description": "a second description",
  *             "creator": "570bb87202073a453dc9b529",
  *             "__v": 0,
  *             "schemaVersion": 1,
  *             "created": "2016-06-03T13:27:59.531Z"
  *            }
  *         ]
  *   oauth_create:
  *     description: Created. With the oauth client application created.
  *     schema:
  *       $ref: "#/definitions/oauth_document"
  *     examples:
  *       application/json:
  *         {
  *           "__v": 0,
  *           "clientSecret": "2g4202xyYKy7v60j9xa5WkprzGvvkh9f8yltAVTa",
  *           "clientId": "3vsB8opK4PX5mmtxrsD7",
  *           "name": "deuze",
  *           "redirectUri": "http://www.mydomain.com/endpoint",
  *           "description": "a little description",
  *           "creator": "570bb87202073a453dc9b529",
  *           "_id": "575185dfac66cee912e6fa14",
  *           "schemaVersion": 1,
  *           "created": "2016-06-03T13:27:59.531Z"
  *         }
  *   oauth_document:
  *     description: Ok. With oauth client application of given id.
  *     schema:
  *       $ref: "#/definitions/oauth_document"
  *     examples:
  *       application/json:
  *         {
  *            "_id": "5751834cac66cee912e6fa13",
  *            "clientSecret": "GInS3NruSjtET7C4MRfaEDz8vSLKErXJzpifJSxH",
  *            "clientId": "LHHYavlKfKt97pZppGwM",
  *            "name": "app2",
  *            "redirectUri": "http://www.mydomain.com/company",
  *            "description": "a second description",
  *            "creator": "570bb87202073a453dc9b529",
  *            "__v": 0,
  *            "schemaVersion": 1,
  *            "created": "2016-06-03T13:27:59.531Z"
  *         }
  */
