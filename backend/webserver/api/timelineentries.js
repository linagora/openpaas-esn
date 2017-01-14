'use strict';

var authorize = require('../middleware/authorization');
var timelineentries = require('../controllers/timelineentries');

module.exports = function(router) {
  /**
   * @swagger
   * /timelineentries:
   *   get:
   *     tags:
   *      - Timeline Entries
   *     description:
   *       Query the timeline of the current user
   *     parameters:
   *       - $ref: "#/parameters/tl_limit"
   *       - $ref: "#/parameters/tl_offset"
   *     responses:
   *       200:
   *         $ref: "#/responses/tl_entry"
   *       400:
   *         $ref: "#/responses/cm_400"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/timelineentries', authorize.requiresAPILogin, timelineentries.list);

};
