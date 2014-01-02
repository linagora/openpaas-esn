'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'backend/**/*.js', 'frontend/js/**/*.js', 'test/**/**/*.js'],
      options: {
        jshintrc: '.jshintrc',
        ignores: []
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },
    mochacli: {
      options: {
        require: ['chai', 'mockery'],
        reporter: 'spec'
      },
      all: ['test/unit-backend/**/*.js']
    }
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('test-backend', 'run tests', ['test-backend-prepare', 'mochacli']);
  
  grunt.registerTask('test-backend-prepare', 'prepare tests environment', function() {
    var done = this.async();
    
    process.env.NODE_ENV = 'test';
    
    var child = require('child_process').spawn('sh', ['./scripts/prepare-backend-tests-environment.sh']);
    
    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close',function(code) { done(code ? false : true); });
  });

  grunt.registerTask('gjslint', 'run the closure linter', function() {
    var done = this.async();
    
    var child = require('child_process').spawn('python', ['./scripts/gjslint.py', '--disable', '0110', '--nojsdoc', '-r', 'test', '-r', 'backend']);
    
    child.stdout.on('data', function(chunk) { grunt.log.write(chunk); });
    child.stderr.on('data', function(chunk) { grunt.log.error(chunk); });
    child.on('close',function(code) { done(code ? false : true); });
  });


  grunt.registerTask('test', ['jshint', 'gjslint', 'test-backend']);
  grunt.registerTask('default', ['test']);

};