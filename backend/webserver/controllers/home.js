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
  if (!req.user) {
    return res.render('welcome/index', {
      title: 'Home'
    });
  }

  return res.render('index', {
    title: 'Home'
  });
}
module.exports.index = index;
