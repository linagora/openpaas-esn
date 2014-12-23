'use strict';

var gjslint = require('closure-linter-wrapper').gjslint;

module.exports = function(grunt) {
  var CI = grunt.option('ci');

  grunt.registerTask('gjslint', 'run the closure linter', function() {
    var done = this.async();
    var flagsArray = [
      '--disable 0110',
      '--nojsdoc',
      '-r tasks',
      '-r test',
      '-r backend',
      '-r frontend/js',
      '-r modules',
      '-e test/frontend/karma-include',
      '-x frontend/js/modules/modernizr.js',
      'Gruntfile.js',
      'Gruntfile-tests.js'
    ];

    var reporter;
    if (CI) {
      reporter = { name: 'gjslint_xml', dest: 'gjslint.xml' };
    } else {
      reporter = { name: 'console' };
    }

    gjslint({
      flags: flagsArray,
      reporter: reporter
    }, function(err, result) {
      if (CI && !err) {
        grunt.log.ok('Report "gjslint.xml" created.');
      }

      done(!err);
    });
  });
};
