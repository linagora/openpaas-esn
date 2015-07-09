'use strict';

var Docker = require('dockerode');

module.exports = function(grunt) {
  var log = grunt.log;
  var containers = {};

  grunt.registerMultiTask('container', 'Run a container', function() {
    var docker = new Docker(this.docker || {socketPath: '/var/run/docker.sock'});

    var options = this.options();
    var done = options.tasks.async ? function() {} : this.async();

    var data = this.data;
    var target = this.target;
    var container;

    grunt.verbose.writeflags(data, 'Data');
    grunt.verbose.writeflags(options, 'Options');

    var command = this.args[0];

    if (command === 'remove') {
      container = containers[target];
      if (!container) {
        grunt.fatal('No running container for target: ' + target);
      }
      log.writeln('Removing container for target: ' + target + ' (id = ' + container.id + ')');

      container.remove({ force: true }, function(err, data) {
        if (err) {
          grunt.fatal('Unable to remove container for target: ' + target + ' - ' + err.message);
          return done(false);
        }
        delete containers[target];
        log.writeln('Successfully removed container for target: ' + target + ' (id = ' + container.id + ')');
        done();
      });
    } else if (command === 'pull') {
      log.writeln('Pulling image for target: ' + target);
      docker.pull(data.Image, function(err, stream) {
        if (err) {
          grunt.fatal('Could no pull image for target: ' + target + ' - ' + err.message);
          return done(false);
        }
        stream.on('data', function(chunk) {
          log.writeln(chunk);
        });
        stream.on('end', function() {
          done();
        });
      });
    } else {
      log.writeln('Creating container for target: ' + target);
      docker.createContainer(data, function(err, container) {
        if (err) {
          grunt.fatal('Could no create container for target: ' + target + ' - ' + err.message);
        }

        grunt.verbose.writeflags(container, 'Container');

        container.start(options.startContainerOptions, function(err, data) {
          if (err) {
            grunt.fatal('Could not run container for target: ' + target + ' - ' + err.message);
          }

          grunt.verbose.writeflags(data, 'Data');

          containers[target] = container;
          log.writeln('Successfully created container for target: ' + target + ' (id = ' + container.id + ')');

          // Attach a stream only if we need to parse output
          if (typeof options.matchOutput === 'function') {
            container.attach({stream: true, stdout: true, stderr: true}, function(err, stream) {
              if (err) {
                grunt.fatal('Could not attach stream container for target: ' + target + ' - ' + err.message);
              }
              stream.setEncoding('utf8');

              stream.on('data', function(data) {
                options.matchOutput(data);
              });
            });
          } else {
            done();
          }
        });
      });
    }
  });
};
