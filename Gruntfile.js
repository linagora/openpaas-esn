'use strict';

/* eslint-disable no-process-env, no-console */

var os = require('os');
var timeGrunt = require('time-grunt');
var conf_path = './test/config/';
var servers = require(conf_path + 'servers-conf');
var config = require('./config/default.json');
var dockerodeConfig = require('./docker/config/dockerode');
var GruntfileUtils = require('./tasks/utils/Gruntfile-utils');

module.exports = function(grunt) {
  // must be run at the top
  timeGrunt(grunt);

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
    eslint: {
      all: {
        src: ['Gruntfile.js', 'Gruntfile-tests.js', 'tasks/**/*.js', 'test/**/**/*.js', 'backend/**/*.js', 'frontend/js/**/*.js', 'modules/**/*.js', 'bin/**/*.js', 'fixtures/**/*.js']
      },
      quick: {
        src: [],
        options: {
          quiet: true
        }
      },
      options: {
        quiet: true
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
          'frontend/js/**/*.less',
          'modules/*/frontend/css/**/*.less'
        ]
      },
      quick: {
        src: ['<%= eslint.quick.src %>']
      }
    },
    shell: {
      redis: shell.newShell(command.redis, /on port/, 'Redis server is started.'),
      rabbitmq: shell.newShell(command.rabbitmq, /completed with/, 'Rabbitmq server is started.'),
      mongo: shell.newShell(command.mongo(), new RegExp('connections on port ' + servers.mongodb.port), 'MongoDB server is started.'),
      ldap: shell.newShell(command.ldap, /LDAP server up at/, 'Ldap server is started.'),
      elasticsearch: shell.newShell(command.elasticsearch, /started/, 'Elasticsearch server is started.')
    },
    container: {
      options: dockerodeConfig(grunt.option('docker')),

      esn_full_pull: container.newEsnFullContainer({
          name: 'docker-compose-esn-full-pull',
          command: ['pull']
        }),

      esn_full_build: container.newEsnFullContainer({
          name: 'docker-compose-esn-full-build',
          command: ['build', '--force-rm', '--no-cache']
        }),

      esn_full_up: container.newEsnFullContainer({
          name: 'docker-compose-esn-full-up',
          command: ['up', '--no-build'],
          env: [
            'DOCKER_IP=' + servers.host,
            'ESN_PATH=' + __dirname,
            'VIDEO=' + !!process.env.VIDEO,
            'VIDEO_DIR=' + (process.env.VIDEO_DIR || os.tmpdir() + '/videos'),
            'VIDEO_FILE_NAME=' + (process.env.VIDEO_FILE_NAME || 'open-paas.e2e')
          ]
        }, {
          regex: new RegExp('OpenPaas ESN is now started on node'),
          regexForFailed: new RegExp('bind: address already in use'),
          info: 'All ESN docker containers are deployed',
          timeout: 300000
        }),

      esn_full_down: container.newEsnFullContainer({
          name: 'docker-compose-esn-full-remover',
          command: ['down', '-v']
        }),

      redis: container.newContainer({
          Image: servers.redis.container.image,
          name: servers.redis.container.name,
          PortBindings: { '6379/tcp': [{ HostPort: servers.redis.port + '' }] }
        }, {}, {}, {
          regex: null,
          info: 'Redis server is started.'
        }),
      rabbitmq: container.newContainer({
          Image: servers.rabbitmq.container.image,
          name: servers.rabbitmq.container.name,
          PortBindings: { '5672/tcp': [{ HostPort: servers.rabbitmq.port + '' }] }
        }, {}, {}, {
          regex: null,
          info: 'Rabbit server is started.'
        }),
      mongo: container.newContainer({
          Image: servers.mongodb.container.image,
          name: servers.mongodb.container.name,
          Cmd: ['mongod', '--nojournal'],
          PortBindings: { '27017/tcp': [{ HostPort: servers.mongodb.port + '' }] }
        }, {}, {}, {
          regex: new RegExp('connections on port 27017'),
          info: 'MongoDB server is started.'
        }),
      elasticsearch: container.newContainer({
          Image: servers.elasticsearch.container.image,
          name: servers.elasticsearch.container.name,
          Cmd: ['elasticsearch', '-Des.discovery.zen.ping.multicast.enabled=false'],
          PortBindings: { '9200/tcp': [{ HostPort: servers.elasticsearch.port + '' }] },
          Links: [servers.mongodb.container.name + ':mongo']
        }, {}, {}, {
          regex: /started/,
          info: 'Elasticsearch server is started.'
        })
    },
    waitServer: {
      options: { timeout: 120 * 1000, interval: 200, print: false },
      esn: { options: { req: { url: 'http://' + servers.host + ':8080', method: 'GET' } } },
      mongo: { options: { net: { port: 27017 } } },
      redis: { options: { net: { port: 6379 } } },
      rabbitmq: { options: { net: { port: 5672 } } },
      elasticsearch: { options: { req: { url: 'http://' + servers.host + ':9200', method: 'GET' } } },
      jmap: { options: { req: { url: 'http://' + servers.host + ':1080', method: 'OPTIONS' } } },
      cassandra: { options: { net: { port: 9042 } } }
    },
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          nodeArgs: ['--preserve-symlinks'],
          env: {NODE_ENV: 'dev'},
          ignore: ['frontend', '.git', 'README.md', 'node_modules', 'test', 'doc', 'fixtures', 'log', 'bin', 'Gruntfile*.js', 'tasks', 'docker', 'packaging'],
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
      all_with_storage: runGrunt.newProcess(['test-unit-storage', 'test-modules-unit-storage', 'test-midway-backend', 'test-modules-midway-backend']),
      modules_midway_backend: runGrunt.newProcess(['test-modules-midway-backend']),
      modules_unit_backend: runGrunt.newProcess(['test-modules-unit-backend']),
      modules_unit_storage: runGrunt.newProcess(['test-modules-unit-storage']),
      modules_frontend: runGrunt.newProcess(['test-modules-frontend']),
      e2e: runGrunt.newProcess(['test-e2e'])
    },

    i18n_checker: {
      all: {
        options: {
          baseDir: __dirname,
          verifyOptions: {
            defaultLocale: 'en',
            locales: ['en', 'fr', 'vi', 'zh'],
            rules: [
              'all-keys-translated',
              'all-locales-present',
              'default-locale-translate',
              'key-trimmed',
              'no-duplicate-with-core',
              'no-untranslated-key',
              'valid-json-file'
            ]
          }
        }
      }
    },

    swagger_generate: {
      options: {
        baseDir: __dirname,
        swaggerOutputFile: 'doc/REST_API/swagger/swagger.json',
        info: {
          title: 'OpenPaaS',
          description: 'OpenPaaS API',
          version: '0.1'
        },
        host: 'localhost:8080',
        securityDefinitions: {
          auth: {
            type: 'oauth2',
            description: 'OAuth2 security scheme for the OpenPaaS API',
            flow: 'password',
            tokenUrl: 'localhost:8080/oauth/token',
            scopes: {}
          }
        },
        paths: [
          'backend/webserver/api/*.js',
          'doc/REST_API/swagger/*/*.js',
          'modules/*/backend/webserver/**/*.js',
          'modules/*/doc/swagger/*/*.js'
        ]
      }
    },

    puglint: {
      all: {
        options: {
          config: {
            disallowAttributeInterpolation: true,
            disallowLegacyMixinCall: true,
            validateExtensions: true,
            validateIndentation: 2
          }
        },
        src: [
          'frontend/**/*.pug',
          'modules/**/*.pug',
          'templates/**/*.pug'
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-shell-spawn');
  grunt.loadNpmTasks('grunt-continue');
  grunt.loadNpmTasks('@linagora/grunt-run-grunt');
  grunt.loadNpmTasks('@linagora/grunt-lint-pattern');
  grunt.loadNpmTasks('grunt-docker-spawn');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-wait-server');
  grunt.loadNpmTasks('@linagora/grunt-i18n-checker');
  grunt.loadNpmTasks('grunt-swagger-generate');
  grunt.loadNpmTasks('grunt-puglint');

  grunt.loadTasks('tasks');

  grunt.registerTask('spawn-containers', 'spawn servers', ['container:redis', 'container:rabbitmq', 'container:mongo', 'container:elasticsearch']);
  grunt.registerTask('pull-containers', 'pull containers', ['container:redis:pull', 'container:rabbitmq:pull', 'container:mongo:pull', 'container:elasticsearch:pull']);
  grunt.registerTask('kill-containers', 'kill servers', ['container:redis:remove', 'container:rabbitmq:remove', 'container:mongo:remove', 'container:elasticsearch:remove']);
  grunt.registerTask('setup-mongo-es-docker', ['spawn-containers', 'continue:on', 'setupElasticsearchIndexes']);

  grunt.registerTask('spawn-servers', 'spawn servers', ['shell:redis', 'shell:rabbitmq', 'shell:mongo', 'shell:elasticsearch']);
  grunt.registerTask('kill-servers', 'kill servers', ['shell:redis:kill', 'shell:rabbitmq:kill', 'shell:mongo:kill', 'shell:elasticsearch:kill']);
  grunt.registerTask('setup-environment', 'create temp folders and files for tests', gruntfileUtils.setupEnvironment());
  grunt.registerTask('clean-environment', 'remove temp folder for tests', gruntfileUtils.cleanEnvironment());
  grunt.registerTask('setupElasticsearchIndexes', 'setup elasticsearch indexes', gruntfileUtils.setupElasticsearchIndexes());

  grunt.registerTask('dev', ['nodemon:dev']);
  grunt.registerTask('setup-mongo-es', ['spawn-servers', 'continue:on', 'setupElasticsearchIndexes']);

  grunt.registerTask('test-e2e', ['test-e2e-up', 'continue:on', 'run_grunt:e2e', 'test-e2e-down', 'continue:off', 'continue:fail-on-warning']);
  grunt.registerTask('test-e2e-quick', ['test-e2e-up', 'run_grunt:e2e']);
  grunt.registerTask('test-e2e-wait-servers', ['waitServer:esn', 'waitServer:mongo', 'waitServer:redis', 'waitServer:elasticsearch', 'waitServer:jmap', 'waitServer:cassandra']);
  grunt.registerTask('test-e2e-prepare', ['container:esn_full_pull:pull', 'container:esn_full_build:pull', 'container:esn_full_up:pull', 'container:esn_full_down:pull', 'test-e2e-pull', 'test-e2e-build']);

  grunt.registerTask('test-e2e-pull', ['container:esn_full_pull', 'container:esn_full_pull:remove']);
  grunt.registerTask('test-e2e-build', ['continue:on', 'test-e2e-remove-esn_base', 'test-e2e-remove-esn', 'continue:off', 'test-e2e-build-esn_base', 'container:esn_full_build', 'container:esn_full_build:remove']);
  grunt.registerTask('test-e2e-up', ['continue:on', 'container:esn_full_up', 'container:esn_full_up:remove', 'continue:off', 'continue:fail-on-warning', 'test-e2e-wait-servers']);
  grunt.registerTask('test-e2e-down', ['container:esn_full_down', 'container:esn_full_down:remove']);
  grunt.registerTask('test-e2e-clean', 'Clean all compose containers', ['continue:on', 'container:esn_full_pull:remove', 'container:esn_full_build:remove', 'container:esn_full_up:remove', 'container:esn_full_down:remove', 'continue:off']);
  grunt.registerTask('test-e2e-build-esn_base', gruntfileUtils.buildEsnBaseImage());
  grunt.registerTask('test-e2e-remove-esn_base', gruntfileUtils.removeEsnBaseImage());
  grunt.registerTask('test-e2e-remove-esn', gruntfileUtils.removeEsnImage());

  grunt.registerTask('test-unit-backend', ['setup-environment', 'run_grunt:unit_backend', 'clean-environment']);

  grunt.registerTask('test-modules-unit-backend', ['setup-environment', 'run_grunt:modules_unit_backend', 'clean-environment']);

  grunt.registerTask('test-unit-storage', ['setup-environment', 'setup-mongo-es', 'run_grunt:unit_storage', 'kill-servers', 'clean-environment']);
  grunt.registerTask('docker-test-unit-storage', ['setup-environment', 'setup-mongo-es-docker', 'run_grunt:unit_storage', 'kill-containers', 'clean-environment']);
  grunt.registerTask('gitlab-test-unit-storage', ['setup-environment', 'setupElasticsearchIndexes', 'run_grunt:unit_storage', 'clean-environment']);

  grunt.registerTask('test-modules-unit-storage', ['setup-environment', 'setup-mongo-es', 'run_grunt:modules_unit_storage', 'kill-servers', 'clean-environment']);
  grunt.registerTask('docker-test-modules-unit-storage', ['setup-environment', 'setup-mongo-es-docker', 'run_grunt:modules_unit_storage', 'kill-containers', 'clean-environment']);
  grunt.registerTask('gitlab-test-modules-unit-storage', ['setup-environment', 'setupElasticsearchIndexes', 'run_grunt:modules_unit_storage', 'clean-environment']);

  grunt.registerTask('test-frontend', ['run_grunt:frontend']);
  grunt.registerTask('test-modules-frontend', ['run_grunt:modules_frontend']);

  grunt.registerTask('test-modules-midway', ['setup-environment', 'setup-mongo-es', 'run_grunt:modules_midway_backend', 'kill-servers', 'clean-environment']);
  grunt.registerTask('gitlab-test-modules-midway', ['setup-environment', 'setupElasticsearchIndexes', 'run_grunt:modules_midway_backend', 'clean-environment']);
  grunt.registerTask('docker-test-modules-midway', ['setup-environment', 'setup-mongo-es-docker', 'run_grunt:modules_midway_backend', 'kill-containers', 'clean-environment']);

  grunt.registerTask('test', ['linters', 'setup-environment', 'run_grunt:frontend', 'run_grunt:modules_frontend', 'run_grunt:unit_backend', 'run_grunt:modules_unit_backend', 'setup-mongo-es', 'run_grunt:all_with_storage', 'kill-servers', 'clean-environment']);
  grunt.registerTask('docker-test', ['linters', 'setup-environment', 'run_grunt:frontend', 'run_grunt:modules_frontend', 'run_grunt:unit_backend', 'run_grunt:modules_unit_backend', 'setup-mongo-es-docker', 'run_grunt:all_with_storage', 'kill-containers', 'clean-environment']);

  grunt.registerTask('test-midway-backend', ['setup-environment', 'setup-mongo-es', 'run_grunt:midway_backend', 'kill-servers', 'clean-environment']);
  grunt.registerTask('docker-test-midway-backend', ['setup-environment', 'setup-mongo-es-docker', 'run_grunt:midway_backend', 'kill-containers', 'clean-environment']);
  grunt.registerTask('gitlab-test-midway-backend', ['setup-environment', 'setupElasticsearchIndexes', 'run_grunt:midway_backend', 'clean-environment']);

  grunt.registerTask('i18n', 'Check the translation files', ['i18n_checker']);
  grunt.registerTask('swagger-generate', 'Grunt plugin for swagger generate', ['swagger_generate']);
  grunt.registerTask('pug-linter', 'Check the pug/jade files', ['puglint:all']);
  grunt.registerTask('linters', 'Check code for lint', ['eslint:all', 'lint_pattern', 'i18n', 'pug-linter']);

  /**
   * Usage:
   *   grunt linters-dev              # Run linters against files changed in git
   *   grunt linters-dev -r 51c1b6f   # Run linters against a specific changeset
   */
  grunt.registerTask('linters-dev', 'Check changed files for lint', ['prepare-quick-lint', 'eslint:quick', 'lint_pattern:quick']);

  grunt.registerTask('default', ['test']);
  grunt.registerTask('fixtures', 'Launch the fixtures injection', function() {
    var done = this.async();
    var fixtures = require('./fixtures');

    fixtures(done);
  });
};
