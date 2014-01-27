//
// JSON Store. Push/get JSON data to file storage backend.
// The JSON store may be used by the wizard service in order to store wizard configuration data ie for small amount of data.
//

'use strict';

var fs = require('fs');

/**
 * Get the wizard settings storage file
 *
 * @return {string} the configuration file descriptor
 */
function file(path) {
  return path || __dirname + '../../../config/db.json';
}

exports = module.exports = function(path) {

  return {

    /**
     * Get all the data as JSON.
     *
     * @param {function} callback
     */
    all: function(callback) {
      fs.readFile(file(path), 'utf8', function(err, data) {
        if (err) {
          callback(err);
        } else {
          var json = null;
          try {
            json = JSON.parse(data);
          } catch (err) {
            json = {};
          }
          callback(null, json);
        }
      });
    },

    /**
     * Save the data to the configuration file. Will create the file if it does not exist.
     *
     * @param {string} key - The configuration key. Any setting needs a key so we can retrieve data from it if needed.
     * @param {json} data - The data as JSON
     * @param {function} callback
     */
    push: function(key, data, callback) {
      if (!key || !data) {
        return callback(new Error('key and data can not be null'));
      }

      // read the file, append the data to the JSON and write it back
      this.all(function(err, json) {
        if (err) {
          // the file may not be already here, ignore it
        }

        var out = json || {};
        out[key] = data;
        fs.writeFile(file(path), JSON.stringify(out), function(err) {

          if (err) {
            callback(err);
          } else {
            callback();
          }
        });
      });
    },

    /**
     * Get configuration settings from key.
     *
     * @param {string} key - The key to get settings from
     * @param {function} callback
     */
    get: function(key, callback) {
      if (!key) {
        return callback(new Error('Key can not be null'));
      }

      this.all(function(err, json) {
        if (err) {
          callback(err);
        } else {
          if (json && json[key]) {
            callback(null, json[key]);
          } else {
            callback(new Error('Can not get JSON settings for ' + key));
          }
        }
      });
    }
  };
};
