'use strict';

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Application = mongoose.model('Application');
var zlib = require('zlib');
var tar = require('tar');
var fs = require('fs-extra');
var path = require('path');
var async = require('async');

var DEPLOYMENT_DIR = path.join(__dirname, '../../../apps');

function AwesomeAppManager(dependencies, moduleManager) {
  this.logger = dependencies('logger');
  this.storage = dependencies('filestore');
  this.imageModule = dependencies('community');
  this.communityModule = dependencies('community');
  this.localPubsub = dependencies('pubsub').local;
  this.esnconfig = dependencies('esn-config');
  this.moduleManager = moduleManager;
}

AwesomeAppManager.prototype.getDeploymentDirForApplication = function(application, version) {
  // For now for the loader, into apps should be modules of which the directory is named the same than their AwesomeModule
  // they are installing. We remove then application.title and version from the path.
  return path.join(DEPLOYMENT_DIR);
};

AwesomeAppManager.prototype.store = function(application, callback) {
  if (!application) {
    return callback(new Error('Cannot store application without data.'));
  }

  if (application.deployments) {
    return callback(new Error('Cannot store application with deployments defined.'));
  }

  var app = new Application(application);
  app.save(callback);
};

AwesomeAppManager.prototype.getById = function(id, callback) {
  if (!id) {
    return callback(new Error('Application id is required'));
  }
  return Application.findOne({_id: id}, callback);
};

AwesomeAppManager.prototype.get = function(query, callback) {
  query = query || {};
  return Application.find(query, callback);
};

AwesomeAppManager.prototype.delete = function(id, callback) {
  if (!id) {
    return callback(new Error('Application id is required'));
  }
  return Application.findByIdAndRemove(id, callback);
};

AwesomeAppManager.prototype.getAvatar = function(artifactId, query, callback) {
  return this.imageModule.getAvatar(artifactId, query, callback);
};

AwesomeAppManager.prototype.updateAvatar = function(application, avatar, callback) {
  if (!application) {
    return callback(new Error('application is required'));
  }

  if (!avatar) {
    return callback(new Error('avatar is required'));
  }

  application.avatar = avatar;
  application.save(callback);
};

AwesomeAppManager.prototype.uploadAvatar = function(avatarId, mimetype, metadata, req, callback) {
  // It should be done here.
  // var avatarId = uuid.v1();
  return this.imageModule.recordAvatar(avatarId, mimetype, metadata, req, callback);
};

AwesomeAppManager.prototype.getArtifact = function(artifactId, callback) {
  return this.storage.getFileStream(artifactId, callback);
};

AwesomeAppManager.prototype.updateArtifact = function(application, artifactMetadata, callback) {
  if (!application) {
    return callback(new Error('application is required'));
  }

  if (!artifactMetadata) {
    return callback(new Error('avatar is required'));
  }

  application.artifacts.push(artifactMetadata);
  application.save(callback);
};

function getDuplicates(readable) {
  var PassThrough = require('stream').PassThrough;
  var p1 = new PassThrough();
  var p2 = new PassThrough();
  readable.pipe(p1);
  readable.pipe(p2);
  return [p1, p2];
}

AwesomeAppManager.prototype.uploadArtifact = function(application, contentType, metadata, stream, options, callback) {
  var self = this;
  var fileId = new ObjectId();

  function returnFileMeta(err) {
    if (err) {
      return callback(err);
    }

    return self.storage.getMeta(fileId, callback);
  }

  function updateApplication(application, updates, callback) {
    var options = {};
    return application.update(updates, options, callback);
  }

  function storeArtifact(contentType, metadata, stream, options, callback) {
    return self.storage.store(fileId, contentType, metadata, stream, options, callback);
  }

  function extractInjectionJson(srcArchive) {
    var stringInjection = '';
    var stringModuleName = '';
    return srcArchive
      .pipe(zlib.Unzip())
      .pipe(tar.Parse())
      .on('entry', function(entry) {
        var self = this;
        if (/\injection.json$/.test(entry.path)) {
          stringModuleName = entry.path.split('/')[0];
          entry.on('data', function(chunk) {
            stringInjection += chunk;
          }).on('end', function() {
            if (!stringInjection) {
              self.emit('error', new Error('Unable to find a valid injection.json in the artifact'));
            } else {
              var metadata = {};
              metadata.injection = JSON.parse(stringInjection);
              metadata.moduleName = stringModuleName;
              self.emit('metadata', metadata);
            }
          });
        }
      });
  }

  var injection = {};
  var moduleName = {};
  var streams = getDuplicates(stream);
  extractInjectionJson(streams[0])
    .on('metadata', function(metadata) {
      injection = metadata.injection;
      moduleName = metadata.moduleName;
    })
    .on('end', function() {
      async.parallel([
        updateApplication.bind(null, application, {$push: {'targetInjections': injection}, 'moduleName': moduleName}),
        storeArtifact.bind(null, contentType, metadata, streams[1], options)
      ],
        returnFileMeta
      );
    })
    .on('error', function(err) {
      return callback(err);
    });
};

AwesomeAppManager.prototype.deploy = function(application, deployData, callback) {
  var self = this;

  if (!deployData || !deployData.target || !deployData.target.id || !deployData.version) {
    return callback(new Error('Deploy data is not correctly formatted.'));
  }

  if (!deployData.target.objectType || deployData.target.objectType !== 'domain') {
    return callback(new Error('Unsupported deploy object.'));
  }

  var isApplicationAlreadyDeployed = application.deployments.filter(function(deployment) {
    return (deployment.target.id + '' === deployData.target.id + '') && (deployment.version === deployData.version);
  });

  if (isApplicationAlreadyDeployed.length > 0) {
    this.logger.debug('Application was not deployed because a previous deployment already existed.');
    return callback(null, application);
  }

  var applicationPath = this.getDeploymentDirForApplication(application, deployData.version);
  var deploy = deployData;

  function extractArtifactToPath(applicationPath, artifact, callback) {
    if (!artifact) {
      return callback(new Error('Could not retrieve archive file.'));
    }

    artifact
      .pipe(zlib.Unzip())
      .pipe(tar.Extract({ path: applicationPath }))
      .on('end', function() {
        return callback(null);
      }).on('error', function(err) {
        return callback(err);
      });
  }

  function getArtifactStream(artifact, callback) {
    if (!artifact) {
      return callback(new Error('Artifact is needed to retreive the associated stream.'));
    }
    self.getArtifact(artifact.id, callback);
  }

  function getArtifactMetadataFromVersion(application, version, callback) {
    application.getArtifactFromVersion(version, function(err, artifact) {
      if (err) {
        return callback(err);
      }

      if (!artifact) {
        return callback(new Error('Can not find artifact for version ' + version));
      }

      return callback(null, artifact);
    });
  }

  // We register the application here to gain time while installing it
  // TODO use applicationPath when we supports version in applicationPath
  function registerAppIntoManager(application, applicationPath, callback) {
    var modulePath = path.normalize(
      path.join(DEPLOYMENT_DIR, application.moduleName)
    );

    var exists = fs.existsSync(modulePath);
    if (exists) {
      self.moduleManager.manager.registerModule(require(modulePath), false);
    } else {
      return callback(new Error('This application does not exist'));
    }



    return callback(null);
  }

  function registerAppIntoEsnConfig(application, callback) {
    var configuration = self.esnconfig('injection');
    configuration.get(function(err, injection) {
      if (err) {
        callback(err);
      }
      if (!injection) {
        configuration.store({ modules: [application.moduleName] }, callback);
      } else {
        var newModules = injection.modules || [];
        if (newModules.indexOf(application.moduleName) === -1) {
          newModules.push(application.moduleName);
          configuration.set('modules', newModules, callback);
        } else {
          callback(null);
        }
      }
    });
  }

  async.waterfall([
    getArtifactMetadataFromVersion.bind(null, application, deployData.version),
    getArtifactStream,
    extractArtifactToPath.bind(null, applicationPath),
    registerAppIntoManager.bind(null, application, applicationPath),
    registerAppIntoEsnConfig.bind(null, application)
  ], function(err) {
    if (err) {
      return callback(err);
    }
    application.deployments.push(deploy);
    application.save(callback);
  });
};

AwesomeAppManager.prototype.undeploy = function(application, target, callback) {
  var self = this;

  if (!application) {
    return callback(new Error('Application is required.'));
  }

  if (!target) {
    return callback(new Error('Target is required.'));
  }

  var otherTargetDeployments = application.deployments.filter(function(deployment) {
    return deployment.target.id + '' !== target.id + '';
  });

  if (otherTargetDeployments.length === application.deployments.length) {
    this.logger.debug('Application has no existing deployments for this target.');
    return callback(null, application);
  }

  function unregisterAppIntoEsnConfig(application, callback) {
    var configuration = self.esnconfig('injection');
    configuration.get(function(err, injection) {
      if (err) {
        callback(err);
      }
      if (!injection) {
        callback(null);
      } else {
        var modules = injection.modules || [];
        var newModules = modules.filter(function(module) {
          return module !== application.moduleName;
        });
        configuration.set('modules', newModules, callback);
      }
    });
  }

  function removeAppFromFs(application, callback) {
    fs.remove(self.getDeploymentDirForApplication(application, ''), function(err) {
      if (err) {
        return callback(err);
      }

      application.deployments = otherTargetDeployments;
      application.save(callback);
    });
  }

  async.series([
    unregisterAppIntoEsnConfig.bind(null, application),
    removeAppFromFs.bind(null, application)
  ], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
};

AwesomeAppManager.prototype.setDeployState = function(application, deployTarget, newState, callback) {
  if (!application) {
    return callback(new Error('Application object is required.'));
  }

  if (!application.deployments) {
    return callback(new Error('Application does not have deployments.'));
  }

  var targettedDeploys = application.deployments.filter(function(deployment) {
    return deployment.target.id + '' !== deployTarget + '';
  });

  if (targettedDeploys.length === 0) {
    this.logger.debug('No deployment was found for this target.');

    return callback(null, application);
  }

  targettedDeploys[0].state = newState;

  application.save(callback);
};

AwesomeAppManager.prototype.install = function(application, target, callback) {
  var self = this;

  if (!application) {
    return callback(new Error('Application is required.'));
  }

  if (!target || !target.id) {
    return callback(new Error('Target is required.'));
  }

  if (!target.objectType || target.objectType !== 'community') {
    return callback(new Error('Unsupported install target.'));
  }

  function addInstallsToComplicantDeploys(application, community, callback) {
    var compliantDeploys = application.deployments.filter(function(deploy) {
      return self.communityModule.hasDomain(community, deploy.target.id);
    });

    if (compliantDeploys.length === 0) {
      return callback(new Error('Cannot install application before it has been deployed.'));
    }

    var install = { objectType: 'community', id: target.id };
    compliantDeploys[0].installs.push(install);
    callback(null, compliantDeploys);
  }

  function saveApplication(application, compliantDeploys, callback) {
    application.save(function(err, saved) {
      if (err) {
        return callback(err);
      }
      callback(null, compliantDeploys, saved);
    });
  }

  function publishToLocalPubsub(compliantDeploys, savedApplication, callback) {
    var installedApplication = {
      application: savedApplication,
      target: target,
      domain: compliantDeploys[0].target
    };
    self.localPubsub.topic('appstore:application:installed').publish(installedApplication);
    callback(null);
  }

  function startApplication(application, callback) {
    self.moduleManager.manager.fire('start', application.moduleName).then(function() {
      return callback(null);
    }, function(err) {
      return callback(new Error(err.message));
    });
  }

  async.waterfall([
    self.communityModule.load.bind(null, target.id),
    addInstallsToComplicantDeploys.bind(null, application),
    saveApplication.bind(null, application),
    publishToLocalPubsub,
    startApplication.bind(null, application)
  ], function(err) {
    if (err) {
      return callback(err);
    }
    return callback(null);
  });
};

AwesomeAppManager.prototype.uninstall = function(application, target, callback) {
  if (!application) {
    return callback(new Error('Application is required.'));
  }

  if (!target || !target.id) {
    return callback(new Error('Target is required.'));
  }

  if (!target.objectType || target.objectType !== 'community') {
    return callback(new Error('Unsupported install target.'));
  }

  function getDomainsRemovedFrom(application, community, callback) {
    var compliantDeploys = application.deployments.filter(function(deploy) {
      return self.communityModule.hasDomain(community, deploy.target.id);
    });

    if (compliantDeploys.length === 0) {
      return callback(new Error('Cannot uninstall an application which it has not been deployed.'));
    }

    var installToRemove = target;
    var domainsRemovedFrom = [];

    compliantDeploys.forEach(function(deploy) {
      var installs = deploy.installs.filter(function(install) {
        return install.id === installToRemove.id;
      });
      if (installs.length > 0) {
        deploy.installs = deploy.installs.filter(function(install) {
          return install.id !== installToRemove.id;
        });
        domainsRemovedFrom.push(deploy.target);
      }
    });
    callback(null, domainsRemovedFrom);
  }

  function saveApplication(application, domainsRemovedFrom, callback) {
    application.save(function(err, saved) {
      if (err) {
        return callback(err);
      }
      callback(null, domainsRemovedFrom, saved);
    });
  }

  function publishToLocalPubsub(domainsRemovedFrom, savedApplication, callback) {
    var uninstalledApplication = {
      application: savedApplication,
      target: target,
      domains: domainsRemovedFrom
    };

    self.localPubsub.topic('appstore:application:uninstalled').publish(uninstalledApplication);
    callback(null);
  }

  var self = this;
  async.waterfall([
    self.communityModule.load.bind(null, target.id),
    getDomainsRemovedFrom.bind(null, application),
    saveApplication.bind(null, application),
    publishToLocalPubsub
  ], function(err) {
    if (err) {
      return callback(err);
    }
    return callback(null);
  });
};

module.exports.AwesomeAppManager = AwesomeAppManager;
