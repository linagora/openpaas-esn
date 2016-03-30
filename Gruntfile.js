'use strict';

var util = require('util');

var conf_path = './test/config/';
var servers = require(conf_path + 'servers-conf');
var config = require('./config/default.json');
var GruntfileUtils = require('./tasks/utils/Gruntfile-utils');
var fixtures = require('./fixtures');

module.exports = function(grunt) {
  var CI = grunt.option('ci');

  var gruntfileUtils = new GruntfileUtils(grunt, servers);
  var shell = gruntfileUtils.shell();
  var container = gruntfileUtils.container();
  var command = gruntfileUtils.command();
  var runGrunt = gruntfileUtils.runGrunt();

  function readDockerCert(name) {
    try {
      return grunt.file.read(process.env.DOCKER_CERT_PATH + '/' + name, 'utf-8');
    } catch (e) {
      return '';
    }
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      }
    },
    eslint: {
      all: {
        src: ['Gruntfile.js', 'Gruntfile-tests.js', 'tasks/**/*.js', 'test/**/**/*.js', 'backend/**/*.js', 'frontend/js/**/*.js', 'modules/**/*.js', 'bin/**/*.js']
      },
      quick: {
        src: [],
        options: {
          quiet: false
        }
      },
      options: {
        quiet: true
      }

    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        ignores: ['test/frontend/karma-include/*', 'frontend/js/modules/modernizr.js', 'modules/**/thirdparty/*.js'],
        reporter: CI && 'checkstyle',
        reporterOutput: CI && 'jshint.xml'
      },
      all: {
        src: ['<%= eslint.all.src %>']
      },
      quick: {
        // You must run the prepare-quick-lint target before jshint:quick,
        // files are filled in dynamically.
        src: ['<%= eslint.quick.src %>']
      }
    },
    jscs: {
      options: {
        config: '.jscsrc'
      },
      all: {

        src: ['<%= eslint.all.src %>', '!test/frontend/karma-include/*', '!frontend/js/modules/modernizr.js', '!modules/**/thirdparty/*.js']
      },
      quick: {
        src: ['<%= eslint.quick.src %>']
      }
    },
    lint_pattern: {
      options: {
        rules: [
          { pattern: /(describe|it)\.only/, message: 'Must not use .only in tests' }
        ]
      },
      all: {
        src: ['<%= eslint.all.src %>']
      },
      css: {
        options: {
          rules: [
            { pattern: /important;(\s*$|(?=\s+[^\/]))/, message: 'CSS important rules only allowed with explanatory comment' }
          ]
        },
        src: [
          'frontend/css/**/*.less',
          'modules/*/frontend/css/**/*.less'
        ]
      },
      quick: {
        src: ['<%= eslint.quick.src %>']
      }
    },
    shell: {
      redis: shell.newShell(command.redis, /on port/, 'Redis server is started.'),
      mongo: shell.newShell(command.mongo(false), new RegExp('connections on port ' + servers.mongodb.port), 'MongoDB server is started.'),
      mongo_replSet: shell.newShell(command.mongo(true), new RegExp('connections on port ' + servers.mongodb.port), 'MongoDB server is started.'),
      ldap: shell.newShell(command.ldap, /LDAP server up at/, 'Ldap server is started.'),
      elasticsearch: shell.newShell(command.elasticsearch, /started/, 'Elasticsearch server is started.')
    },
    container: {
      options: {
        localhost: {
          socketPath: '/var/run/docker.sock'
        },
        remote: {
          host: process.env.DOCKER_HOST || '192.168.99.100',
          port: process.env.DOCKER_PORT || 2376,
          ca: readDockerCert('ca.pem'),
          cert: readDockerCert('cert.pem'),
          key: readDockerCert('key.pem'),
          pass: process.env.DOCKER_CERT_PASS || 'mypass'
        }
      },
      esn_full: container.newContainer({
          Image: 'docker/compose:1.6.2',
          name: 'docker-compose-esn-full-' + Date.now(),
          Cmd: ['-f', 'docker/dockerfiles/platform/docker-compose.yml', 'up'],
          WorkingDir: '/compose',
          Env: [
            'DOCKER_IP=' + servers.host,
            'PROVISION=true',
            'ESN_PATH=' + __dirname
          ],
          HostConfig: {
            Binds: [__dirname + ':/compose', '/var/run/docker.sock:/var/run/docker.sock']
          }
        }, {},
        new RegExp('OpenPaas ESN is now started on node'),
        'All ESN docker containers are deployed'),
      esn_full_remover: container.newContainer({
          Image: 'docker/compose:1.6.2',
          name: 'docker-compose-esn-full-remover-' + Date.now(),
          Cmd: ['-f', 'docker/dockerfiles/platform/docker-compose.yml', 'down'],
          WorkingDir: '/compose',
          HostConfig: {
            Binds: [__dirname + ':/compose', '/var/run/docker.sock:/var/run/docker.sock']
          }
        }, {},
        new RegExp('Removing network platform_default'),
        'All ESN docker containers have been removed'),
      redis: container.newContainer({
          Image: servers.redis.container.image,
          name: servers.redis.container.name
        }, {
          PortBindings: { '6379/tcp': [{ HostPort: servers.redis.port + '' }] }
        },
        null, 'Redis server is started.'),
      mongo: container.newContainer({
          Image: servers.mongodb.container.image,
          name: servers.mongodb.container.name,
          Cmd: ['mongod', '--nojournal']
        }, {
          PortBindings: { '27017/tcp': [{ HostPort: servers.mongodb.port + '' }] }
        },
        new RegExp('connections on port 27017'), 'MongoDB server is started.'),
      mongo_replSet: container.newContainer({
          Image: servers.mongodb.container.image,
          name: servers.mongodb.container.name,
          Cmd: util.format('mongod --replSet %s --smallfiles --oplogSize 128', servers.mongodb.replicat_set_name).split(' ')
        }, {
          PortBindings: { '27017/tcp': [{ HostPort: servers.mongodb.port + '' }] },
          ExtraHosts: ['mongo:127.0.0.1']
        },
        new RegExp('connections on port 27017'), 'MongoDB server is started.'),
      elasticsearch: container.newContainer({
          Image: servers.elasticsearch.container.image,
          name: servers.elasticsearch.container.name,
          Cmd: ['elasticsearch', '-Des.discovery.zen.ping.multicast.enabled=false']
        }, {
          PortBindings: { '9200/tcp': [{ HostPort: servers.elasticsearch.port + '' }] },
          Links: [servers.mongodb.container.name + ':mongo']
        },
        /started/, 'Elasticsearch server is started.')
    },
    waitServer: {
      options: { timeout: 60 * 1000, interval: 200, print: false },
      esn: { options: { net: { port: 8080 } } },
      mongo: { options: { net: { port: 27017 } } },
      redis: { options: { net: { port: 6379 } } },
      elasticsearch: { options: { net: { port: 9200 } } },
      jmap: { options: { net: { port: 1080 } } },
      cassandra: { options: { net: { port: 9042 } } }
    },
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          env: {NODE_ENV: 'dev'},
          ignore: ['frontend/**', '.git', 'README.md', 'node_modules/**', 'test/**', 'doc/**', 'fixtures/**', 'log/**'],
          watchedExtensions: ['js'],
          callback: function(nodemon) {
            nodemon.on('log', function(event) {
              console.log(event.colour);
            });

            nodemon.on('config:update', function() {
              // Delay before server listens on port
              setTimeout(function() {
                require('open')('http://localhost:' + config.webserver.port || 8080);
              }, 2000);
            });
          }
        }
      }
    },
    run_grunt: {
      all: runGrunt.newProcess(),
      midway_backend: runGrunt.newProcess(['test-midway-backend']),
      unit_backend: runGrunt.newProcess(['test-unit-backend']),
      frontend: runGrunt.newProcess(['test-frontend']),
      unit_storage: runGrunt.newProcess(['test-unit-storage']),
      all_with_storage: runGrunt.newProcess(['test-unit-storage', 'test-midway-backend', 'test-modules-midway-backend']),
      modules_midway_backend: runGrunt.newProcess(['test-modules-midway-backend']),
      modules_unit_backend: runGrunt.newProcess(['test-modules-unit-backend']),
      modules_frontend: runGrunt.newProcess(['test-modules-frontend']),
      e2e: runGrunt.newProcess(['test-e2e'])
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },
    'node-inspector': {
      dev: {
        options: {
          'web-host': 'localhost',
          'web-port': config.webserver.debugPort || 8081,
          'save-live-edit': true,
          'no-preload': true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-shell-spawn');
  grunt.loadNpmTasks('grunt-continue');
  grunt.loadNpmTasks('grunt-run-grunt');
  grunt.loadNpmTasks('grunt-node-inspector');
  grunt.loadNpmTasks('grunt-lint-pattern');
  grunt.loadNpmTasks('grunt-docker-spawn');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-wait-server');

  grunt.loadTasks('tasks');

  grunt.registerTask('spawn-containers', 'spawn servers', ['container:redis', 'container:mongo_replSet', 'container:elasticsearch']);
  grunt.registerTask('pull-containers', 'pull containers', ['container:redis:pull', 'container:mongo_replSet:pull', 'container:elasticsearch:pull']);
  grunt.registerTask('kill-containers', 'kill servers', ['container:redis:remove', 'container:mongo_replSet:remove', 'container:elasticsearch:remove']);
  grunt.registerTask('setup-mongo-es-docker', ['spawn-containers', 'continue:on', 'mongoReplicationMode:docker', 'setupElasticsearchUsersIndex', 'setupElasticsearchContactsIndex']);

  grunt.registerTask('spawn-servers', 'spawn servers', ['shell:redis', 'shell:mongo_replSet', 'shell:elasticsearch']);
  grunt.registerTask('kill-servers', 'kill servers', ['shell:redis:kill', 'shell:mongo_replSet:kill', 'shell:elasticsearch:kill']);
  grunt.registerTask('setup-environment', 'create temp folders and files for tests', gruntfileUtils.setupEnvironment());
  grunt.registerTask('clean-environment', 'remove temp folder for tests', gruntfileUtils.cleanEnvironment());
  grunt.registerTask('mongoReplicationMode', 'setup mongo replica set', gruntfileUtils.setupMongoReplSet());
  grunt.registerTask('setupElasticsearchUsersIndex', 'setup elasticsearch mongodb users index', gruntfileUtils.setupElasticsearchUsersIndex());
  grunt.registerTask('setupElasticsearchContactsIndex', 'setup elasticsearch mongodb contacts index', gruntfileUtils.setupElasticsearchContactsIndex());

  grunt.registerTask('dev', ['nodemon:dev']);
  grunt.registerTask('debug', ['node-inspector:dev']);
  grunt.registerTask('setup-mongo-es', ['spawn-servers', 'continue:on', 'mongoReplicationMode', 'setupElasticsearchUsersIndex', 'setupElasticsearchContactsIndex']);

  grunt.registerTask('test-e2e', ['test-e2e-quick', 'test-e2e-down']);
  grunt.registerTask('test-e2e-quick', ['container:esn_full', 'test-e2e-wait-servers', 'container:esn_full:remove', 'continue:on', 'run_grunt:e2e']);
  grunt.registerTask('test-e2e-wait-servers', ['waitServer:esn', 'waitServer:mongo', 'waitServer:redis', 'waitServer:elasticsearch', 'waitServer:jmap', 'waitServer:cassandra']);
  grunt.registerTask('test-e2e-down', ['container:esn_full_remover', 'container:esn_full_remover:remove']);

  grunt.registerTask('test-midway-backend', ['setup-environment', 'setup-mongo-es', 'run_grunt:midway_backend', 'kill-servers', 'clean-environment']);
  grunt.registerTask('test-unit-backend', ['setup-environment', 'run_grunt:unit_backend', 'clean-environment']);
  grunt.registerTask('test-modules-unit-backend', ['setup-environment', 'run_grunt:modules_unit_backend', 'clean-environment']);
  grunt.registerTask('test-unit-storage', ['setup-environment', 'setup-mongo-es', 'run_grunt:unit_storage', 'kill-servers', 'clean-environment']);
  grunt.registerTask('test-frontend', ['run_grunt:frontend']);
  grunt.registerTask('test-modules-frontend', ['run_grunt:modules_frontend']);
  grunt.registerTask('test-modules-midway', ['setup-environment', 'setup-mongo-es', 'run_grunt:modules_midway_backend', 'kill-servers', 'clean-environment']);
  grunt.registerTask('test', ['linters', 'setup-environment', 'run_grunt:frontend', 'run_grunt:modules_frontend', 'run_grunt:unit_backend', 'run_grunt:modules_unit_backend', 'setup-mongo-es', 'run_grunt:all_with_storage', 'kill-servers', 'clean-environment']);
  grunt.registerTask('docker-test', ['linters', 'setup-environment', 'run_grunt:frontend', 'run_grunt:modules_frontend', 'run_grunt:unit_backend', 'run_grunt:modules_unit_backend', 'setup-mongo-es-docker', 'run_grunt:all_with_storage', 'kill-containers', 'clean-environment']);
  grunt.registerTask('docker-test-unit-storage', ['setup-environment', 'setup-mongo-es-docker', 'run_grunt:unit_storage', 'kill-containers', 'clean-environment']);
  grunt.registerTask('docker-test-midway-backend', ['setup-environment', 'setup-mongo-es-docker', 'run_grunt:midway_backend', 'kill-containers', 'clean-environment']);
  grunt.registerTask('docker-test-modules-midway', ['setup-environment', 'setup-mongo-es-docker', 'run_grunt:modules_midway_backend', 'kill-containers', 'clean-environment']);
  grunt.registerTask('linters', 'Check code for lint', ['eslint:all', 'jscs:all', 'lint_pattern']);

  /**
   * Usage:
   *   grunt linters-dev              # Run linters against files changed in git
   *   grunt linters-dev -r 51c1b6f   # Run linters against a specific changeset
   */
  grunt.registerTask('linters-dev', 'Check changed files for lint', ['prepare-quick-lint', 'eslint:quick', 'jscs:quick', 'lint_pattern:quick']);

  grunt.registerTask('default', ['test']);
  grunt.registerTask('fixtures', 'Launch the fixtures injection', function() {
    var done = this.async();
    fixtures(done);
  });
};
