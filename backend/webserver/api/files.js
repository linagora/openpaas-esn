'use strict';

var authorize = require('../middleware/authorization');
var requestMW = require('../middleware/request');
var files = require('../controllers/files');
var fileMiddleware = require('../middleware/file');

module.exports = function(router) {

  /**
   * @swagger
   * /files:
   *   post:
   *     tags:
   *       - File
   *     description: Post a new avatar.
   *     parameters:
   *       - $ref: "#/parameters/fi_name"
   *       - $ref: "#/parameters/fi_mimetype"
   *       - $ref: "#/parameters/fi_size"
   *       - $ref: "#/parameters/fi_raw_data"
   *     responses:
   *       201:
   *         $ref: "#/responses/cm_201"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       412:
   *         $ref: "#/responses/cm_412"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/files', authorize.requiresAPILogin, requestMW.requireBody, requestMW.requireQueryParams('mimetype', 'size'), files.create);

  /**
   * @swagger
   * /files/{id}:
   *   get:
   *     tags:
   *       - File
   *     description: Retrieve the raw file data with the given id.
   *     parameters:
   *       - $ref: "#/parameters/av_if_modified_since"
   *       - $ref: "#/parameters/fi_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/fi_stream"
   *       304:
   *         $ref: "#/responses/cm_304"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       503:
   *         $ref: "#/responses/cm_503"
   */
  router.get('/files/:id', authorize.requiresAPILogin, files.get);

  /**
   * @swagger
   * /files/{id}:
   *   delete:
   *     tags:
   *       - File
   *     description: Delete a given file.
   *     parameters:
   *       - $ref: "#/parameters/fi_id"
   *     responses:
   *       204:
   *         $ref: "#/responses/cm_204"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       409:
   *         $ref: "#/responses/fi_error_conflict"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.delete('/files/:id', authorize.requiresAPILogin, requestMW.castParamToObjectId('id'), fileMiddleware.loadMeta, fileMiddleware.isOwner, files.remove);
};
