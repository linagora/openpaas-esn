const avatars = require('../controllers/avatars');

module.exports = router => {

  /**
   * @swagger
   * /avatars :
   *   get:
   *     tags:
   *      - Avatar
   *     description: Retrieve avatar of a resource.
   *     parameters:
   *       - $ref: "#/parameters/av_type"
   *       - $ref: "#/parameters/av_email"
   *       - $ref: "#/parameters/av_id"
   *       - $ref: "#/parameters/av_format"
   *       - $ref: "#/parameters/av_if_modified_since"
   *     responses:
   *       200:
   *         $ref: "#/responses/av_stream"
   *       304:
   *         $ref: "#/responses/cm_304"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/avatars', avatars.get);
};
