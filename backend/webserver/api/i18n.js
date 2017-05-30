const authorize = require('../middleware/authorization');
const i18nController = require('../controllers/i18n');

module.exports = function(router) {
  /**
   * @swagger
   * /i18n:
   *   get:
   *     tags:
   *      - i18n
   *     description:
   *       Get the i18n translation
   *     responses:
   *       200:
   *         $ref: "#/responses/i18n_catalog"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/i18n', authorize.requiresAPILogin, i18nController.getCatalog);
};
