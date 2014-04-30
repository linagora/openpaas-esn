'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');

module.exports.findStreamResource = function(req, res, next) {

  var uuid = req.params.uuid;
  if (!uuid) {
    return res.json(400, {error: {code: 400, message: 'Bad parameter', details: 'Stream UUID is required'}});
  }

  Domain.getFromActivityStreamID(uuid, function(err, domain) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while searching the stream resource : ' + err.message}});
    }

    if (!domain) {
      return res.json(404, {error: {code: 404, message: 'Not Found', details: 'Can not find a valid resource for the stream : ' + uuid}});
    }

    req.activity_stream = {
      objectType: 'domain',
      _id: domain._id
    };
    next();
  });
};
