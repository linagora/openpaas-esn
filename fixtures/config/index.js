'use strict';

var fs = require('fs');
var path = require('path');
var config = path.normalize(__dirname, '/../../config');

var copyFile = function(name, done) {
  console.log(' -> Copy file ', name);
  fs.readFile(name, function(err, data) {
    if (err) {
      return done(err);
    }

    var name = path.normalize(config, name);
    fs.writeFile(name, data, function(err) {
      if (err) {
        return done(err);
      } else {
        return done();
      }
    });
  });
};

module.exports = function(done) {
  var data = path.normalize(__dirname, 'data');
  fs.readdirSync(data).forEach(function (filename) {
    var f = data + '/' + filename;
    if (fs.statSync(f).isFile()) {
      copyFile(f, function(err) {
        if (err) {
          console.log('  [ERROR] ' + f + ' has not been copied (' + err.message + ')');
        } else {
          console.log('  [OK] ' + f + ' has been copied');
        }
      });
    }
  });
  if (done) {
    done();
  }
};

