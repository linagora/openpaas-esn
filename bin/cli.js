'use strict';

const fs = require('fs-extra');
const q = require('q');
const path = require('path');
const commandsPath = path.resolve(path.join(__dirname, 'commands'));
const yargs = require('yargs');
const readdir = q.denodeify(fs.readdir);

readdir(commandsPath).then(function(files) {
  files.forEach(function(filename) {
    const filePath = path.join(commandsPath, filename);

    if (fs.statSync(filePath).isFile()) {
      const command = require('./commands/' + filename).command;

      yargs.command(command);
    }
  });

  yargs
    .usage('Usage: $0 <command> [options]')
    .demand(1, 'You need to specify a command')
    .help()
    .version()
    .epilogue('for more information, go to https://open-paas.org')
    .example('$0 configure --help', 'show help of configure command')
    .argv;
}).catch(err => console.error(err));
