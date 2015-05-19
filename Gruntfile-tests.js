'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    concat: {
      options: {
        separator: ';'
      }
    },

    splitfiles: {
      options: {
        chunk: 10
      },
      backend: {
        options: {
          common: ['test/unit-backend/all.js'],
          target: 'mochacli:backend'
        },
        files: {
          src: ['test/unit-backend/**/*.js']
        }
      },
      modulesBackend: {
        options: {
          common: ['test/module-unit-backend-all.js', 'modules/**/all.js'],
          target: 'mochacli:modulesBackend'
        },
        files: {
          src: ['modules/**/test/unit-backend/**/*.js']
        }
      },
      midway: {
        options: {
          common: ['test/midway-backend/all.js'],
          target: 'mochacli:midway'
        },
        files: {
          src: ['test/midway-backend/**/*.js']
        }
      },
      modulesMidway: {
        options: {
          common: ['test/midway-backend/all.js'],
          target: 'mochacli:modulesMidway'
        },
        files: {
          src: ['modules/**/test/midway-backend/**/*.js']
        }
      }
    },
    mochacli: {
      options: {
        require: ['chai', 'mockery'],
        reporter: 'spec',
        timeout: process.env.TEST_TIMEOUT || 20000,
        env: {
          ESN_CUSTOM_TEMPLATES_FOLDER: 'testscustom'
        }
      },
      backend: {
        options: {
          files: ['test/unit-backend/all.js', grunt.option('test') || 'test/unit-backend/**/*.js']
        }
      },
      modulesBackend: {
        options: {
          files: ['test/module-unit-backend-all.js', grunt.option('test') || 'modules/**/test/unit-backend/**/*.js']
        }
      },
      midway: {
        options: {
          files: ['test/midway-backend/all.js', grunt.option('test') || 'test/midway-backend/**/*.js']
        }
      },
      modulesMidway: {
        options: {
          files: ['test/midway-backend/all.js', grunt.option('test') || 'modules/**/test/midway-backend/**/*.js']
        }
      },
      storage: {
        options: {
          files: ['test/unit-storage/all.js', grunt.option('test') || 'test/unit-storage/**/*.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-mocha-cli');

  grunt.loadTasks('tasks');

  grunt.registerTask('test-unit-backend', 'run the backend unit tests (to be used with .only)', ['splitfiles:backend']);
  grunt.registerTask('test-modules-unit-backend', 'run modules unit backend tests', ['splitfiles:modulesBackend']);
  grunt.registerTask('test-midway-backend', 'run midway tests (to be used with .only)', ['splitfiles:midway']);
  grunt.registerTask('test-modules-midway-backend', 'run modules midway backend tests', ['splitfiles:modulesMidway']);
  grunt.registerTask('test-unit-storage', 'run storage tests', ['mochacli:storage']);
  grunt.registerTask('test-backend', 'run both the unit & midway tests', ['test-unit-backend', 'test-unit-storage', 'test-midway-backend']);

  grunt.registerTask('test-frontend', 'run the FrontEnd tests', function() {
    var done = this.async();

    var child = require('child_process').spawn('karma', ['start', '--browsers', 'PhantomJS', './test/config/karma.conf.js']);

    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close', function(code) { done(code ? false : true); });
  });

  grunt.registerTask('test-modules-frontend', 'run the FrontEnd tests', function() {
    var done = this.async();

    var child = require('child_process').spawn('karma', ['start', '--browsers', 'PhantomJS', './test/config/karma.modules.conf.js']);

    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close', function(code) { done(code ? false : true); });
  });

  grunt.registerTask('test-frontend-all', 'run the FrontEnd tests on all possible browsers', function() {
    var done = this.async();

    var child = require('child_process').spawn('karma', ['start', '--browsers', 'PhantomJS,Firefox,Chrome', './test/config/karma.conf.js']);

    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close', function(code) { done(code ? false : true); });
  });

  grunt.registerTask('test-modules-frontend-all', 'run the FrontEnd tests on all possible browsers', function() {
    var done = this.async();

    var child = require('child_process').spawn('karma', ['start', '--browsers', 'PhantomJS,Firefox,Chrome', './test/config/karma.modules.conf.js']);

    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close', function(code) { done(code ? false : true); });
  });

  grunt.registerTask('test', ['test-backend', 'test-frontend']);
  grunt.registerTask('default', ['test']);
};
