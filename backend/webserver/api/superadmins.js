const authorizationMw = require('../middleware/authorization');
const superadminsMw = require('../middleware/superadmins');
const helperMw = require('../middleware/helper');
const controller = require('../controllers/superadmins');

module.exports = function(router) {

  router.post('/superadmins/init',
    superadminsMw.canCreateFirstSuperAdmin,
    controller.createSuperAdmin);

  router.get('/superadmins',
    authorizationMw.requiresAPILogin,
    superadminsMw.requireSuperAdmin,
    controller.getAllSuperAdmins);

  router.post('/superadmins',
    authorizationMw.requiresAPILogin,
    superadminsMw.requireSuperAdmin,
    helperMw.requireBody,
    controller.createSuperAdmin);

  router.delete('/superadmins',
    authorizationMw.requiresAPILogin,
    superadminsMw.requireSuperAdmin,
    controller.removeSuperAdmin);
};
