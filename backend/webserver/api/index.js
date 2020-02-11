'use strict';

var _ = require('lodash');

var API_VERSIONS = {
  'v0.1': {
    label: 'OpenPaaS API version 0.1',
    path: 'v0.1'
  }
};

var API_FIRST_VERSION = 'v0.1';
var API_CURRENT_VERSION = API_FIRST_VERSION;

function getVersions(req, res) {
  return res.status(200).json(_.map(API_VERSIONS, function(apiversion) {
    return apiversion;
  }));
}

function getVersionById(req, res) {
  var version = API_VERSIONS[req.params.id];

  if (version) {
    return res.status(200).json(version);
  } else {
    return res.status(404).json({ error: { code: 404, message: 'Version does not exist.'}});
  }
}

function getLatestVersion(req, res) {
  return res.status(200).json({latest: API_CURRENT_VERSION});
}

function setupAPI(application) {
  var router = require('express').Router();

  /**
   * @swagger
   * /versions:
   *   get:
   *     tags:
   *       - Version
   *     description: Get available versions of the OpenPaaS API.
   *     responses:
   *       200:
   *         $ref: "#/responses/vs_versions"
   *       400:
   *         $ref: "#/responses/cm_400"
   */
  router.get('/versions', getVersions);

  /**
   * @swagger
   * /versions/latest:
   *   get:
   *     tags:
   *       - Version
   *     description: Get the latest available version of the OpenPaaS API.
   *     responses:
   *       200:
   *         $ref: "#/responses/vs_latest"
   */
  router.get('/versions/latest', getLatestVersion);

  /**
   * @swagger
   * /versions/{id}:
   *   get:
   *     tags:
   *       - Version
   *     description: Get the version with the given id.
   *     parameters:
   *       - $ref: "#/parameters/vs_id"
   *     responses:
   *       200:
   *         $ref: "#/responses/vs_version"
   *       404:
   *         $ref: "#/responses/cm_404"
   */
  router.get('/versions/:id', getVersionById);

  require('./activitystreams')(router);
  require('./authentication')(router);
  require('./availability')(router);
  require('./avatars')(router);
  require('./collaborations')(router);
  require('./companies')(router);
  require('./configurations')(router);
  require('./document-store')(router);
  require('./domains')(router);
  require('./feedback')(router);
  require('./files')(router);
  require('./follow')(router);
  require('./jwt')(router);
  require('./locales')(router);
  require('./login')(router);
  require('./messages')(router);
  require('./monitoring')(router);
  require('./notifications')(router);
  require('./oauthclients')(router);
  require('./passwordreset')(router);
  require('./resource-link')(router);
  require('./platformadmins')(router);
  require('./timelineentries')(router);
  require('./user')(router);
  require('./users')(router);
  require('./people')(router);
  require('./ldap')(router);
  require('./i18n')(router);
  require('./themes')(router);

  application.use('/api', router);
  application.use('/api/v0.1', router);
}

module.exports.setupAPI = setupAPI;
module.exports.API_VERSIONS = API_VERSIONS;
module.exports.API_CURRENT_VERSION = API_CURRENT_VERSION;
