'use strict';

module.exports.formatHeaders = function formatHeaders(headers) {
  if (!headers) {
    return [];
  }
  var formattedHeaders = [];
  Object.keys(headers).forEach(function(header) {
    if (headers[header] instanceof Array) {
      headers[header].forEach(function(value) {
        formattedHeaders.push([header, value]);
      });
    } else {
      formattedHeaders.push([header, headers[header]]);
    }
  });

  return formattedHeaders;
};
