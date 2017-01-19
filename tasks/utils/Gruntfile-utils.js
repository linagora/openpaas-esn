'use strict';

var util = require('util');
var fs = require('fs-extra');
var path = require('path');
var extend = require('extend');
var EsnConfig = require('esn-elasticsearch-configuration');
var Docker = require('dockerode');
var dockerodeConfig = require('../../docker/config/dockerode');
var DOCKER_IMAGES = require('../../docker/images.json');

function _args(grunt) {
  var opts = ['test', 'chunk', 'ci', 'reporter'];
  var args = {};

  opts.forEach(function(optName) {
    var opt = grunt.option(optName);

    if (opt) {
      args[optName] = '' + opt;
    }
  });

  return args;
}

function _taskEndIfMatch(grunt, regexSuccess, infoSuccess, regexFailed) {
  var taskIsDone = false;

  return function(chunk, done) {
    if (taskIsDone) { return; }

    if (regexSuccess || regexFailed) {
      done = done || grunt.task.current.async();
      if (regexSuccess && regexSuccess.test(String(chunk))) {
        taskIsDone = true;
        grunt.log.oklns(infoSuccess);
        done(true);
      } else if (regexFailed && regexFailed.test(String(chunk))) {
        taskIsDone = true;
        grunt.log.error(chunk);
        done(false);
      }
    }
  };
}

function _taskSuccessIfStreamEnds(grunt, verbose) {
  return function(chunk, done) {
    if (chunk === null) {
      done(true);
    } else if (verbose) {
      grunt.log.writeln(chunk);
    }
  };
}

function GruntfileUtils(grunt, servers) {
  this.grunt = grunt;
  this.servers = servers;
  this.args = _args(grunt);
}

GruntfileUtils.prototype.command = function command() {
  var servers = this.servers;
  var commandObject = {};

  commandObject.ldap = servers.ldap.cmd;
  commandObject.rabbitmq = servers.rabbitmq.cmd;

  commandObject.redis = util.format('%s --port %s %s %s',
      servers.redis.cmd,
      (servers.redis.port ? servers.redis.port : '23457'),
      (servers.redis.pwd ? '--requirepass' + servers.redis.pwd : ''),
      (servers.redis.conf_file ? servers.redis.conf_file : ''));

  commandObject.mongo = function() {
    return util.format('%s --dbpath %s --port %s %s',
      servers.mongodb.cmd,
      servers.mongodb.dbpath,
      (servers.mongodb.port ? servers.mongodb.port : '23456'),
      '--nojournal');
  };

  commandObject.elasticsearch = servers.elasticsearch.cmd +
      ' -Des.http.port=' + servers.elasticsearch.port +
      ' -Des.transport.tcp.port=' + servers.elasticsearch.communication_port +
      ' -Des.cluster.name=' + servers.elasticsearch.cluster_name +
      ' -Des.path.data=' + servers.elasticsearch.data_path +
      ' -Des.path.work=' + servers.elasticsearch.work_path +
      ' -Des.path.logs=' + servers.elasticsearch.logs_path +
      ' -Des.discovery.zen.ping.multicast.enabled=false';

  return commandObject;
};

GruntfileUtils.prototype.shell = function shell() {
  var grunt = this.grunt;

  return {
    newShell: function(command, regex, info) {
      return {
        command: command,
        options: {
          async: false,
          stdout: _taskEndIfMatch(grunt, regex, info),
          stderr: grunt.log.error,
          canKill: true
        }
      };
    }
  };
};

GruntfileUtils.prototype.container = function container() {
  var grunt = this.grunt;

  function newContainer(createContainerOptions, startContainerOptions, removeContainerOptions, taskOptions) {
    taskOptions = extend({ async: false }, taskOptions);

    if (taskOptions.regex || taskOptions.regexForFailed) {
      taskOptions.matchOutput = _taskEndIfMatch(grunt, taskOptions.regex, taskOptions.info, taskOptions.regexForFailed);
    }

    createContainerOptions.options = {
      taskOptions: taskOptions,
      startContainerOptions: startContainerOptions,
      removeContainerOptions: removeContainerOptions
    };

    return createContainerOptions;
  }

  function newEsnFullContainer(containerOptions, taskOptions) {
    var composeFile = 'docker/dockerfiles/dev/docker-compose-e2e' + (process.env.LOCAL ? '-local.yml' : '.yml');

    taskOptions = extend({
      async: false,
      matchOutput: _taskSuccessIfStreamEnds(grunt, grunt.option('show-logs'))
    }, taskOptions);

    return newContainer({
        Image: 'docker/compose:1.6.2',
        name: containerOptions.name,
        Cmd: ['-f', composeFile].concat(containerOptions.command),
        WorkingDir: '/compose',
        Env: containerOptions.env || [],
        HostConfig: {
          Binds: [path.normalize(__dirname + '/../..') + ':/compose', '/var/run/docker.sock:/var/run/docker.sock']
        }
      }, {}, {}, taskOptions);
  }

  return {
    newContainer: newContainer,
    newEsnFullContainer: newEsnFullContainer
  };
};

GruntfileUtils.prototype.buildDockerImage = function(source, buildOptions) {
  var grunt = this.grunt;

  return function() {
    var done = this.async();
    var docker = new Docker(dockerodeConfig()[grunt.option('docker')]);

    docker.buildImage(source, buildOptions, (err, stream) => {
      stream.setEncoding('utf8');

      if (err) {
        grunt.fail.fatal('Failed to build image, reason: ' + err);
      } else {
        docker.modem.followProgress(stream, err => {
          if (err) {
            grunt.fail.warn(err);

            return done(false);
          }

          grunt.log.oklns('Build image successful!');
          done(true);
        }, event => grunt.log.write(event.status || event.stream));
      }
    });
  };
};

GruntfileUtils.prototype.buildEsnBaseImage = function() {
  var dockerfilePath = 'docker/dockerfiles/base/Dockerfile';

  return this.buildDockerImage({
    context: path.normalize(__dirname + '/../../'),
    src: ['package.json', 'bower.json', dockerfilePath]
  }, {
    t: DOCKER_IMAGES.esn_base,
    dockerfile: dockerfilePath,
    nocache: true,
    pull: true
  });
};

GruntfileUtils.prototype.removeDockerImage = function(imageName) {
  var grunt = this.grunt;

  return function() {
    var done = this.async();
    var docker = new Docker(dockerodeConfig()[grunt.option('docker')]);

    docker
      .getImage(imageName)
      .remove({ force: true }, function(err) {
        if (err) {
          grunt.fail.warn('The ' + imageName + ' image has not been removed, reason: ' + err.reason);
          done(false);
        } else {
          grunt.log.oklns('The ' + imageName + ' image has well been removed');
          done(true);
        }
      });
  };
};

GruntfileUtils.prototype.removeEsnBaseImage = function() {
  return this.removeDockerImage(DOCKER_IMAGES.esn_base);
};

GruntfileUtils.prototype.removeEsnImage = function() {
  return this.removeDockerImage(DOCKER_IMAGES.esn);
};

GruntfileUtils.prototype.runGrunt = function runGrunt() {
  var grunt = this.grunt;
  var args = this.args;

  function _process(res) {
    if (res.fail) {
      grunt.config.set('esn.tests.success', false);
      grunt.fail.warn(res.error || new Error(res.output));
      grunt.log.writeln('failed');
    } else {
      grunt.config.set('esn.tests.success', true);
      grunt.log.writeln('succeeded');
    }
  }
  return {
    newProcess: function(task) {
      return {
        options: {
          log: true,
          stdout: grunt.log.write,
          stderr: grunt.log.error,
          args: args,
          process: _process,
          task: task
        },
        src: ['Gruntfile-tests.js']
      };
    }
  };
};

GruntfileUtils.prototype.setupEnvironment = function setupEnvironment() {
  var servers = this.servers;

  return function() {
    try {
      fs.mkdirsSync(servers.mongodb.dbpath);
      fs.mkdirsSync(servers.tmp);
    } catch (err) {
      throw err;
    }
  };
};

GruntfileUtils.prototype.cleanEnvironment = function cleanEnvironment() {
  var grunt = this.grunt;
  var servers = this.servers;

  return function() {
    function _removeAllFilesInDirectory(directory) {
      var files;
      try {
        files = fs.readdirSync(directory);
      } catch (e) {
        return;
      }
      if (files.length > 0) {
        for (var i = 0; i < files.length; i++) {
          var filePath = directory + '/' + files[i];
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          } else {
            _removeAllFilesInDirectory(filePath);
          }
        }
      }
      try {
        fs.rmdirSync(directory);
      } catch (e) {
        console.error(e);
      }
    }

    var testsFailed = !grunt.config.get('esn.tests.success');
    var applog = path.join(servers.tmp, 'application.log');

    if (testsFailed && fs.existsSync(applog)) {
      fs.copySync(applog, 'application.log');
    }
    _removeAllFilesInDirectory(servers.tmp);

    if (testsFailed) {
      grunt.log.writeln('Tests failure');
      grunt.fail.fatal('error', 3);
    }

    var done = this.async();
    done(true);
  };
};

GruntfileUtils.prototype.setupElasticsearchUsersIndex = function() {
  var grunt = this.grunt;
  var servers = this.servers;

  return function() {
    var done = this.async();
    var esnConf = new EsnConfig({host: servers.host, port: servers.elasticsearch.port});
    esnConf.createIndex('users').then(function() {
      grunt.log.write('Elasticsearch users settings are successfully added');
      done(true);
    }, done);
  };
};

GruntfileUtils.prototype.setupElasticsearchContactsIndex = function() {
  var grunt = this.grunt;
  var servers = this.servers;

  return function() {
    var done = this.async();
    var esnConf = new EsnConfig({host: servers.host, port: servers.elasticsearch.port});
    esnConf.createIndex('contacts').then(function() {
      grunt.log.write('Elasticsearch contacts settings are successfully added');
      done(true);
    }, done);
  };
};

GruntfileUtils.prototype.setupElasticsearchEventsIndex = function() {
  var grunt = this.grunt;
  var servers = this.servers;

  return function() {
    var done = this.async();
    var esnConf = new EsnConfig({host: servers.host, port: servers.elasticsearch.port});
    esnConf.createIndex('events').then(function() {
      grunt.log.write('Elasticsearch events settings are successfully added');
      done(true);
    }, done);
  };
};

module.exports = GruntfileUtils;
