const i18nController = require('../controllers/i18n');

module.exports = function(router) {
  /**
   * @swagger
   * /api/i18n:
   *   get:
   *     tags:
   *      - i18n
   *     description:
   *       Get the i18n translation
   *     responses:
   *       200:
   *         $ref: "#/responses/i18n_catalog"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/i18n', i18nController.getCatalog);
};
