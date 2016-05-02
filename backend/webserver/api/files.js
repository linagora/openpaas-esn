'use strict';

var authorize = require('../middleware/authorization');
var requestMW = require('../middleware/request');
var files = require('../controllers/files');
var fileMiddleware = require('../middleware/file');

module.exports = function(router) {
  router.post('/files',
    authorize.requiresAPILogin,
    requestMW.requireBody,
    requestMW.requireQueryParams('mimetype', 'size'),
    files.create);
  router.get('/files/:id', authorize.requiresAPILogin, files.get);
  router.delete('/files/:id', authorize.requiresAPILogin, requestMW.castParamToObjectId('id'), fileMiddleware.loadMeta, fileMiddleware.isOwner, files.remove);
};
