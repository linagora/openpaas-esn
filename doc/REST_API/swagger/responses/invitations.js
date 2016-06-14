/**
 * @swagger
 * response:
 *   iv_create:
 *     description: |
 *       Created. With the invitation document.
 *
 *       It is up to the invitation handler implementation to deal with its validation.
 *     schema:
 *       allOf:
 *         - $ref: "#/definitions/iv_data"
 *         - $ref: "#/definitions/iv_document"
 *     examples:
 *       application/json:
 *         {
 *           "type": "invitation_type",
 *           "uuid": "123456789",
 *           "data": {
 *             "foo": "bar",
 *             "bar": "baz"
 *           }
 *         }
 *   iv_get:
 *     description: Ok. With the invitation
 *     schema:
 *       $ref: "#/definitions/iv_data"
 *     examples:
 *       application/json:
 *         {
 *           "type": "invitation_type",
 *           "uuid": "123456789",
 *           "data": {
 *             "foo": "bar",
 *             "bar": "baz"
 *           }
 *         }
 */
