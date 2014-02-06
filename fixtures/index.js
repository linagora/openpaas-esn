'use strict';

//
// Load all the fixtures and inject in storage using ESN Config module
//

var fs = require('fs');
var path = require('path');

var loadDirectory = function(name, done) {
  console.log('* Loading directory ', name);
  fs.readdirSync(name).forEach(function (filename) {
    var f = name + '/' + filename;
    var stat = fs.statSync(f);
    if (stat.isDirectory()) {
      loadDirectory(f, function() {
        console.log(' ** ' + f + ' has been loaded');
      });
    } else {
      loadFile(f, function(err) {
        if (err) {
          console.log('  [ERROR] ' + f + ' has not been loaded (' + err.message + ')');
        } else {
          console.log('  [OK] ' + f + ' has been loaded');
        }
      });
    }
  });
  if (done) {
    done();
  }
};

var loadFile = function(name, done) {
  console.log(' -> Loading file ', name);
  var data;
  try {
    data = JSON.parse(fs.readFileSync(name));
  } catch(err) {
    if (done) {
      return done(err);
    }
  }
  var item = name.slice(name.lastIndexOf('/') + 1, name.lastIndexOf('.'));
  try {
    var e = require('../backend/core/esn-config')(item);
    e.store(data, function(err) {
      console.log(err);
      if (done) {
        return done(err);
      }
    });
  } catch(err) {
    console.log(err);
    return done(err);
  }
};

loadDirectory(__dirname, function() {
  console.log('Done');
  process.exit();
});