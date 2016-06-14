'use strict';

var documentstore = require('../controllers/document-store');
var documentstoreMiddleware = require('../middleware/document-store');

module.exports = function(router) {
  /**
   * @swagger
   * /document-store/connection:
   *   put:
   *     tags:
   *      - Document-Store
   *     description: Save the connection parameters on the server side.
   *     parameters:
   *       - $ref: "#/parameters/ds_hostname"
   *       - $ref: "#/parameters/ds_port"
   *       - $ref: "#/parameters/ds_dbname"
   *       - $ref: "#/parameters/ds_username"
   *       - $ref: "#/parameters/ds_password"
   *     responses:
   *       201:
   *         $ref: "#/responses/cm_201"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.put('/document-store/connection', [documentstoreMiddleware.failIfConfigured, documentstore.store]);

  /**
   * @swagger
   * /document-store/connection/{hostname}/{port}/{dbname}:
   *   put:
   *     tags:
   *      - Document-Store
   *     description: Check if a connection can be established with the document store.
   *     parameters:
   *       - $ref: "#/parameters/ds_check_hostname"
   *       - $ref: "#/parameters/ds_check_port"
   *       - $ref: "#/parameters/ds_check_dbname"
   *     responses:
   *       200:
   *         $ref: "#/responses/ds_check"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       503:
   *         $ref: "#/responses/cm_503"
   */
  router.put('/document-store/connection/:hostname/:port/:dbname', [documentstoreMiddleware.failIfConfigured, documentstore.test]);
};
