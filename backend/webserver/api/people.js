const authorize = require('../middleware/authorization');
const domain = require('../middleware/domain');
const peopleController = require('../controllers/people');
const { requireValidFieldType } = require('../middleware/people');

module.exports = router => {

  /**
   * @swagger
   * /api/people/search:
   *   get:
   *     tags:
   *      - PeopleSearch
   *     description: Simple search for people in the platform
   *     parameters:
   *       - $ref: "#/parameters/ppl_search_query_q"
   *       - $ref: "#/parameters/cm_limit"
   *       - $ref: "#/parameters/cm_offset"
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         $ref: "#/responses/ppl_search_response"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/people/search', authorize.requiresAPILogin, domain.loadSessionDomain, peopleController.search);

  /**
   * @swagger
   * /api/people/search:
   *   post:
   *     tags:
   *      - PeopleSearch
   *     description: Advanced search for people in the platform. <br>
   *        - This endpoint accepts limit and offset as request body parameters. <br>
   *        - In case these body paramters are not set, it would get limit and offset parameters from query.
   *     parameters:
   *       - $ref: "#/parameters/ppl_search_q"
   *       - $ref: "#/parameters/ppl_search_object_types"
   *       - $ref: "#/parameters/ppl_search_limit"
   *       - $ref: "#/parameters/ppl_search_offset"
   *       - $ref: "#/parameters/cm_offset"
   *       - $ref: "#/parameters/cm_limit"
   *       - $ref: "#/parameters/ppl_search_excludes"
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         $ref: "#/responses/ppl_search_response"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       403:
   *         $ref: "#/responses/cm_403"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.post('/people/search', authorize.requiresAPILogin, domain.loadSessionDomain, peopleController.advancedSearch);

  /**
   * @swagger
   * /api/people/resolve/{fieldType}/{value}:
   *   get:
   *     tags:
   *      - People
   *      - Resolve
   *     description: Find a resolved person object based on a field type and value
   *     parameters:
   *       - $ref: "#/parameters/ppl_resolve_field_type"
   *       - $ref: "#/parameters/ppl_resolve_value"
   *       - $ref: "#/parameters/ppl_object_types_query"
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         $ref: "#/responses/ppl_resolve_response"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       404:
   *         $ref: "#/responses/cm_404"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/people/resolve/:fieldType/:value', authorize.requiresAPILogin, requireValidFieldType, domain.loadSessionDomain, peopleController.resolve);
};
