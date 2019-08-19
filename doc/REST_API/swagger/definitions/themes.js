/**
 * @swagger
 * definition:
 *   tm_themes:
 *     description: The themes object
 *     type: object
 *     properties:
 *       colors:
 *         type: object
 *         properties:
 *           key:
 *             type: string
 *             description: The name of the color variable (primaryColor, accentColor, ...)
 *           value:
 *             type: string
 *             description: The color value in hexadecimal (#2196f3, #FFC107, ...)
 *       logos:
 *         type: object
 *         properties:
 *           logo:
 *             type: string
 *             description: The id of the logo file
 *           favicon:
 *             type: string
 *             description: The id of the favicon file
 *     examples:
 *       application/json:
 *         {
 *           "colors": [
 *             {
 *               "key": "primaryColor",
 *               "value": "#2196f3"
 *             },
 *             {
 *               "key": "secondaryColor",
 *               "value": "#FFC107"
 *             }
 *           ],
 *           "logos": {
 *             "logo": "5d37246f17e6055f91c3f57f",
 *             "favicon": "5d37246f17e6055f91c3f57f"
 *            }
 *         }
 */
