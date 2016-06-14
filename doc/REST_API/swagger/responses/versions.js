/**
 * @swagger
 * response:
 *   vs_versions:
 *     description: OK.  With an array of available versions.
 *     schema:
 *       type: array
 *       items:
 *         $ref: "#/definitions/vs_version"
 *     examples:
 *       application/json:
 *         [
 *           {
 *             "label": "OpenPaaS API version 0.1",
 *             "path": "v0.1"
 *           }
 *         ]
 *   vs_latest:
 *     description: OK.  With the latest available version label
 *     schema:
 *       type: object
 *       properties:
 *         latest:
 *           type: string
 *     examples:
 *       application/json:
 *         {
 *           "latest": "v0.1"
 *         }
 *   vs_version:
 *     description: OK.  With the version description for the given id
 *     schema:
 *       $ref: "#/definitions/vs_version"
 *     examples:
 *       application/json:
 *         {
 *           "label": "OpenPaaS API version 0.1",
 *           "path": "v0.1"
 *         }
 */
