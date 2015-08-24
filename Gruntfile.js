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

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        ignores: ['test/frontend/karma-include/*', 'frontend/js/modules/modernizr.js'],
        reporter: CI && 'checkstyle',
        reporterOutput: CI && 'jshint.xml'
      },
      all: {
        src: [
          'Gruntfile.js',
          'Gruntfile-tests.js',
          'tasks/**/*.js',
          'test/**/**/*.js',
          'backend/**/*.js',
          'frontend/js/**/*.js',
          'modules/**/*.js'
        ]
      },
      quick: {
        // You must run the prepare-quick-lint target before jshint:quick,
        // files are filled in dynamically.
        src: []
      }
    },
    gjslint: {
      options: {
        flags: [
          '--disable 0110',
          '--nojsdoc',
          '-e test/frontend/karma-include',
          '-x frontend/js/modules/modernizr.js'
        ],
        reporter: {
          name: CI ? 'gjslint_xml' : 'console',
          dest: CI ? 'gjslint.xml' : undefined
        }
      },
      all: {
        src: ['<%= jshint.all.src %>']
      },
      quick: {
        src: ['<%= jshint.quick.src %>']
      }
    },
    lint_pattern: {
      options: {
        rules: [
          { pattern: /(describe|it)\.only/, message: 'Must not use .only in tests' }
        ]
      },
      all: {
        src: ['<%= jshint.all.src %>']
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
        src: ['<%= jshint.quick.src %>']
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
      redis: container.newContainer(
        servers.redis.container.image,
        servers.redis.container.name,
        { PortBindings: { '6379/tcp': [{ 'HostPort': servers.redis.port + '' }] } },
        null,
        /on port/, 'Redis server is started.'),
      mongo: container.newContainer(
        servers.mongodb.container.image,
        servers.mongodb.container.name,
        { PortBindings: { '27017/tcp': [{ 'HostPort': servers.mongodb.port + '' }] } },
        ['mongod', '--nojournal'],
        new RegExp('connections on port 27017'), 'MongoDB server is started.'),
      mongo_replSet: container.newContainer(
        servers.mongodb.container.image,
        servers.mongodb.container.name,
        { PortBindings: { '27017/tcp': [{ 'HostPort': servers.mongodb.port + '' }] },
          ExtraHosts: ['mongo:127.0.0.1']},
        util.format('mongod --replSet %s --smallfiles --oplogSize 128', servers.mongodb.replicat_set_name).split(' '),
        new RegExp('connections on port 27017'), 'MongoDB server is started.'),
      elasticsearch: container.newContainer(
        servers.elasticsearch.container.image,
        servers.elasticsearch.container.name,
        { PortBindings: { '9200/tcp': [{ 'HostPort': servers.elasticsearch.port + '' }] },
          Links: [servers.mongodb.container.name + ':mongo'] } ,
        ['elasticsearch', '-Des.discovery.zen.ping.multicast.enabled=false'],
        /started/, 'Elasticsearch server is started.')
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
      modules_frontend: runGrunt.newProcess(['test-modules-frontend'])
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
  grunt.loadNpmTasks('grunt-gjslint');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-shell-spawn');
  grunt.loadNpmTasks('grunt-continue');
  grunt.loadNpmTasks('grunt-run-grunt');
  grunt.loadNpmTasks('grunt-node-inspector');
  grunt.loadNpmTasks('grunt-lint-pattern');
  grunt.loadNpmTasks('grunt-docker-spawn');

  grunt.loadTasks('tasks');

  grunt.registerTask('spawn-containers', 'spawn servers', ['container:redis', 'container:mongo_replSet', 'container:elasticsearch']);
  grunt.registerTask('pull-containers', 'pull containers', ['container:redis:pull', 'container:mongo_replSet:pull', 'container:elasticsearch:pull']);
  grunt.registerTask('kill-containers', 'kill servers', ['container:redis:remove', 'container:mongo_replSet:remove', 'container:elasticsearch:remove']);
  grunt.registerTask('setup-mongo-es-docker', ['spawn-containers', 'continueOn', 'mongoReplicationMode:docker', 'setupElasticsearchUsersIndex', 'setupElasticsearchContactsIndex', 'setupElasticsearchMongoRiver:docker']);

  grunt.registerTask('spawn-servers', 'spawn servers', ['shell:redis', 'shell:mongo_replSet', 'shell:elasticsearch']);
  grunt.registerTask('kill-servers', 'kill servers', ['shell:redis:kill', 'shell:mongo_replSet:kill', 'shell:elasticsearch:kill']);
  grunt.registerTask('setup-environment', 'create temp folders and files for tests', gruntfileUtils.setupEnvironment());
  grunt.registerTask('clean-environment', 'remove temp folder for tests', gruntfileUtils.cleanEnvironment());
  grunt.registerTask('mongoReplicationMode', 'setup mongo replica set', gruntfileUtils.setupMongoReplSet());
  grunt.registerTask('setupElasticsearchMongoRiver', 'setup elasticsearch mongodb river', gruntfileUtils.setupElasticsearchMongoRiver());
  grunt.registerTask('setupElasticsearchUsersIndex', 'setup elasticsearch mongodb users index', gruntfileUtils.setupElasticsearchUsersIndex());
  grunt.registerTask('setupElasticsearchContactsIndex', 'setup elasticsearch mongodb contacts index', gruntfileUtils.setupElasticsearchContactsIndex());

  grunt.registerTask('dev', ['nodemon:dev']);
  grunt.registerTask('debug', ['node-inspector:dev']);
  grunt.registerTask('setup-mongo-es', ['spawn-servers', 'continueOn', 'mongoReplicationMode', 'setupElasticsearchUsersIndex', 'setupElasticsearchContactsIndex', 'setupElasticsearchMongoRiver']);

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
  grunt.registerTask('linters', 'Check code for lint', ['jshint:all', 'gjslint:all', 'lint_pattern']);

  /**
   * Usage:
   *   grunt linters-dev              # Run linters against files changed in git
   *   grunt linters-dev -r 51c1b6f   # Run linters against a specific changeset
   */
  grunt.registerTask('linters-dev', 'Check changed files for lint', ['prepare-quick-lint', 'jshint:quick', 'gjslint:quick', 'lint_pattern:quick']);

  grunt.registerTask('default', ['test']);
  grunt.registerTask('fixtures', 'Launch the fixtures injection', function() {
    var done = this.async();
    fixtures(done);
  });
};
