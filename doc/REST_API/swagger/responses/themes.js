/**
 * @swagger
 * response:
 *   tm_themes:
 *     description: Ok. With an object containing the configured 0penpaaS themes
 *     schema:
 *       type: object
 *     examples:
 *       application/json:
 *         {
 *           "logos": {
 *              "logo": "5d37246f17e6055f91c3f57f",
 *              "favicon": "5d37246f17e6055f91c3f57f"
 *            },
 *            "colors": {
 *              "primaryColor": "#2196f3",
 *              "accentColor": "#FFC107"
 *            }
 *         }
 *   tm_logo:
 *    description: Redirect to te url of the Logo
 *    examples:
 *      redirect to: "DomainUrl/api/files/5d37246f17e6055f91c3f57f"
 *   tm_favicon:
 *    description: Redirect to te url of the Favicon
 *    examples:
 *      redirect to: "DomainUrl/api/files/5d37246f17e6055f91c3f57f"
 */
