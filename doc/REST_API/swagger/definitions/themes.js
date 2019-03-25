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
 *           desktop:
 *             type: string
 *             description: The path of the desktop logo
 *           mobile:
 *             type: string
 *             description: The path of the mobile logo
 *     examples:
 *       application/json:
 *         {
 *           "colors": [
 *             {
 *               "key": "primaryColor",
 *               "value": "#2196f3"
 *             },
 *             {
 *               "key": "sceondaryColor",
 *               "value": "#FFC107"
 *             }
 *           ],
 *           "logos": {
 *             "mobile": "123",
 *             "desktop": "456"
 *            }
 *         }
 */
