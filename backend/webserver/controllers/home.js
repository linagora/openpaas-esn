'use strict';

//
// Home controller (/)
//

/**
 * Get /
 * @param {request} req
 * @param {response} res
 */
function index(req, res) {
  res.render('index', {
    title: 'Home'
  });
}
module.exports.index = index;
