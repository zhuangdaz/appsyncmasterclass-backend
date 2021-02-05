const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const path = require('path')

describe('Query.getMyProfile.request template', () => {
  it("should use userName as 'id'", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Query.getMyProfile.request.vtl')
    const userName = chance.guid()
    const context = given.an_appsync_context({ userName }, {})
    const result = when.we_invoke_an_appSync_template(templatePath, context)

    expect(result).toEqual({
      "version": "2018-05-29",
      "operation": "GetItem",
      "key": {
        "id": {
          "S": userName
        }
      }
    })
  })
})