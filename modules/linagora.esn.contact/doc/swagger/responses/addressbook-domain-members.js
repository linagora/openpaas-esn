/**
 * @swagger
 * response:
 *   addressbook_domain_members_synchronize_jobs:
 *     description: Ok. With a list of submitted jobs containing job id and domain id
 *     schema:
 *       type: array
 *       items:
 *          type: object
 *          properties:
 *            domainId:
 *              type: string
 *            jobId:
 *              type: integer
 *
 *     examples:
 *       application/json:
 *          [
 *            {
 *              "jobId": 97,
 *               "domainId": "5d1ac40cfde54f0160f756d3"
 *            },
 *            {
 *              "jobId": 98,
 *              "domainId": "5d91b80d2fb05f0d29b35f57"
 *            }
 *          ]
 */
