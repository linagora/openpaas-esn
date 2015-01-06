'use strict';

var extend = require('extend');
var acceptedImageTypes = ['image/jpeg', 'image/gif', 'image/png'];
var acceptedArtifactTypes = ['application/x-tar', 'application/x-gzip'];
var Busboy = require('busboy');
var ObjectId = require('mongoose').Types.ObjectId;

module.exports = function(appstoremanager) {

  function list(req, res) {
    var query = req.query || {};

    if (req.query.community) {
      var tuple = { objectType: 'community', id: req.query.community };
      var deploymentMatch = {
        deployments: {
          $elemMatch: tuple
        }
      };
      extend(true, query, deploymentMatch);
    }

    appstoremanager.get(query, function(err, result) {
      if (err) {
        return res.json(500, { error: { code: 500, message: 'app list failed', details: err.message}});
      }

      return res.json(200, result);
    });
  }

  function get(req, res) {
    return res.json(200, req.application);
  }

  function submit(req, res) {
    var application = req.body;

    if (!application) {
      return res.json(400, {error: { code: 400, message: 'Body missing', details: 'body is missing'}});
    }

    appstoremanager.store(application, function(err, saved) {
      if (err) {
        return res.json(500, { error: { code: 500, message: 'Cannot sumbit the application', details: err.message}});
      }

      return res.json(200, {_id: saved._id});
    });
  }

  function deleteApp(req, res) {
    return res.json(500, { error: { code: 500, message: 'App delete failed', details: 'Not implemented yet'}});
  }

  function deploy(req, res) {
    var deployData = req.body;

    if (!deployData) {
      return res.json(400, {error: { code: 400, message: 'Body missing', details: 'body is missing'}});
    }

    appstoremanager.deploy(req.application, deployData, function(err) {
      if (err) {
        return res.json(500, { error: { code: 500, message: 'App save error', details: err.message}});
      }

      return res.json(204);
    });
  }

  function updeploy(req, res) {
    return res.json(500, { error: { code: 500, message: 'App updeploy failed', details: 'Not implemented yet'}});
  }

  function undeploy(req, res) {
    var target = req.body;

    if (!target) {
      return res.json(400, {error: { code: 400, message: 'Body missing', details: 'body is missing'}});
    }

    appstoremanager.undeploy(req.application, target, function(err) {
      if (err) {
        return res.json(500, { error: { code: 500, message: 'App delete failed', details: err.message}});
      }

      return res.json(204);
    });
  }

  function getAvatar(req, res) {
    if (!req.application.avatar) {
      return res.redirect('/appstore/images/application.png');
    }

    appstoremanager.getAvatar(req.application.avatar, req.query.format, function(err, fileStoreMeta, readable) {
      if (err || !readable) {
        return res.redirect('/appstore/images/application.png');
      }

      if (req.headers['if-modified-since'] && Number(new Date(req.headers['if-modified-since']).setMilliseconds(0)) === Number(fileStoreMeta.uploadDate.setMilliseconds(0))) {
        return res.send(304);
      } else {
        res.header('Last-Modified', fileStoreMeta.uploadDate);
        res.status(200);
        return readable.pipe(res);
      }
    });
  }

  function uploadAvatar(req, res) {
    if (!req.query.mimetype) {
      return res.json(400, {error: { code: 400, message: 'Parameter missing', details: 'mimetype parameter is required'}});
    }

    var mimetype = req.query.mimetype.toLowerCase();
    if (acceptedImageTypes.indexOf(mimetype) < 0) {
      return res.json(400, {error: { code: 400, message: 'Bad parameter', details: 'mimetype ' + req.query.mimetype + ' is not acceptable'}});
    }

    if (!req.query.size) {
      return res.json(400, {error: { code: 400, message: 'Parameter missing', details: 'size parameter is required'}});
    }

    var size = parseInt(req.query.size, 10);
    if (isNaN(size)) {
      return res.json(400, {error: { code: 400, message: 'Bad parameter', details: 'size parameter should be an integer'}});
    }
    var avatarId = new ObjectId();

    function updateApplicationAvatar() {
      appstoremanager.updateAvatar(req.application, avatarId, function(err) {
        if (err) {
          return res.json(500, {error: { code: 500, message: 'Datastore failure', details: err.message}});
        }
        return res.json(201, {_id: avatarId});
      });
    }

    function avatarRecordResponse(err, storedBytes) {
      if (err) {
        if (err.code === 1) {
          return res.json(500, {error: { code: 500, message: 'Datastore failure', details: err.message}});
        } else if (err.code === 2) {
          return res.json(500, {error: { code: 500, message: 'Image processing failure', details: err.message}});
        } else {
          return res.json(500, {error: { code: 500, message: 'Internal server error', details: err.message}});
        }
      } else if (storedBytes !== size) {
        return res.json(412, {error: 412, message: 'Image size does not match', details: 'Image size given by user agent is ' + size +
        ' and image size returned by storage system is ' + storedBytes});
      }
      updateApplicationAvatar();
    }

    var metadata = {};
    if (req.user) {
      metadata.creator = {objectType: 'user', id: req.user._id};
    }

    return appstoremanager.uploadAvatar(avatarId, mimetype, metadata, req, avatarRecordResponse);
  }

  function getArtifact(req, res) {
    var artifactId = req.params.artifactId;

    if (!artifactId) {
      res.json(400, {error: { code: 400, message: 'Bad parameter', details: 'missing parameter artifactId'}});
    }

    var artifacts = req.application.artifacts;
    if (!artifacts.length) {
      return res.json(404, { error: { code: 404, message: 'Not found', details: 'artifact not found'}});
    }

    var isArtifactInApplication = artifacts.some(function(artifact) {
      return artifact.id === artifactId;
    });

    if (!isArtifactInApplication) {
      return res.json(404, { error: { code: 404, message: 'Not found', details: 'artifact not found'}});
    }

    appstoremanager.getArtifact(artifactId, function(err, readable) {
      if (err) {
        return res.json(500, { error: { code: 500, message: 'Cannot get artifact', details: err.message}});
      }

      if (!readable) {
        return res.json(404, { error: { code: 404, message: 'Not found', details: 'artifact not found'}});
      }

      res.status(200);
      return readable.pipe(res);
    });
  }

  function uploadArtifact(req, res) {

    if (!req.query.mimetype) {
      return res.json(400, {error: { code: 400, message: 'Parameter missing', details: 'mimetype parameter is required'}});
    }

    var mimetype = req.query.mimetype.toLowerCase();
    if (acceptedArtifactTypes.indexOf(mimetype) < 0) {
      return res.json(400, {error: { code: 400, message: 'Bad parameter', details: 'mimetype ' + req.query.mimetype + ' is not acceptable'}});
    }

    if (!req.query.size) {
      return res.json(400, {error: { code: 400, message: 'Parameter missing', details: 'size parameter is required'}});
    }

    if (!req.query.version) {
      return res.json(400, {error: { code: 400, message: 'Parameter missing', details: 'version parameter is required'}});
    }

    var metadata = {};
    if (req.user) {
      metadata.creator = {objectType: 'user', id: req.user._id};
    }

    var options = {};

    var saveArtifact = function(stream) {
      appstoremanager.uploadArtifact(req.application, mimetype, metadata, stream, options, function(err, fileMetadata) {
        if (err) {
          return res.json(500, { error: { code: 500, message: 'Cannot upload artifact', details: err.message}});
        }

        var artifactMetadata = {id: fileMetadata._id, version: req.query.version};
        appstoremanager.updateArtifact(req.application, artifactMetadata, function(err) {
          if (err) {
            return res.json(500, {error: { code: 500, message: 'Datastore failure', details: err.message}});
          }

          return res.json(201, {_id: fileMetadata._id});
        });
      });
    };

    var nb = 0;
    var busboy = new Busboy({ headers: req.headers });
    busboy.once('file', function(fieldname, file) {
      nb++;
      return saveArtifact(file);
    });

    busboy.on('finish', function() {
      if (nb === 0) {
        res.json(400, {
          error: {
            code: 400,
            message: 'Bad request',
            details: 'The form data must contain an attachment'
          }
        });
      }
    });
    req.pipe(busboy);
  }

  function install(req, res) {
    var target = req.body;

    if (!target) {
      return res.json(400, {error: { code: 400, message: 'Body missing', details: 'body is missing'}});
    }

    appstoremanager.install(req.application, target, function(err) {
      if (err) {
        return res.json(500, { error: { code: 500, message: 'Could not install app', details: err.message}});
      }

      return res.json(205);
    });
  }

  function uninstall(req, res) {
    var target = req.body;

    if (!target) {
      return res.json(400, {error: { code: 400, message: 'Body missing', details: 'body is missing'}});
    }

    appstoremanager.uninstall(req.application, target, function(err) {
      if (err) {
        return res.json(500, { error: { code: 500, message: 'Could not uninstall app', details: err.message}});
      }

      return res.json(205);
    });
  }

  return {
    list: list,
    get: get,
    submit: submit,
    deleteApp: deleteApp,
    deploy: deploy,
    undeploy: undeploy,
    updeploy: updeploy,
    install: install,
    uninstall: uninstall,
    uploadArtifact: uploadArtifact,
    getArtifact: getArtifact,
    getAvatar: getAvatar,
    uploadAvatar: uploadAvatar
  };
};

