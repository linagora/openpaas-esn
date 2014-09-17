'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    concat: {
      options: {
        separator: ';'
      }
    },
    mochacli: {
      options: {
        require: ['chai', 'mockery'],
        reporter: 'spec',
        timeout: 10000,
        env: {
          ESN_CUSTOM_TEMPLATES_FOLDER: 'testscustom'
        }
      },
      backend: {
        options: {
          files: ['test/unit-backend/all.js', grunt.option('test') || 'test/unit-backend/**/*.js']
        }
      },
      midway: {
        options: {
          files: ['test/midway-backend/all.js', grunt.option('test') || 'test/midway-backend/**/*.js']
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

  grunt.registerTask('test-unit-backend', 'run the backend unit tests', ['mochacli:backend']);
  grunt.registerTask('test-midway-backend', 'run midway tests', ['mochacli:midway']);
  grunt.registerTask('test-unit-storage', 'run storage tests', ['mochacli:storage']);
  grunt.registerTask('test-backend', 'run both the unit & midway tests', ['test-unit-backend', 'test-unit-storage', 'test-midway-backend']);

  grunt.registerTask('test-frontend', 'run the FrontEnd tests', function() {
    var done = this.async();

    var child = require('child_process').spawn('karma', ['start', '--browsers', 'PhantomJS', './test/config/karma.conf.js']);

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
  grunt.registerTask('test', ['test-backend', 'test-frontend']);
  grunt.registerTask('default', ['test']);
};
