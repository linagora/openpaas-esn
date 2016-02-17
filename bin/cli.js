'use strict';

var commander = require('commander');
var fs = require('fs-extra');
var q = require('q');
var path = require('path');
var commandsPath = path.resolve(__dirname + '/commands');

var readdir = q.denodeify(fs.readdir);
readdir(commandsPath).then(function(files) {
  files.forEach(function(filename) {
    var file = commandsPath + '/' + filename;
    if (fs.statSync(file).isFile()) {
      var commandName = filename.slice(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.'));
      var command = commander.command(commandName);
      require('./commands/' + commandName).createCommand(command);
    }
  });
  commander.parse(process.argv);
});

