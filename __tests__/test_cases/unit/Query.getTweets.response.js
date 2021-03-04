const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const path = require('path')

describe('Query.getTweets.response template', () => {
  it("should return MyProfile for current user", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Query.getTweets.request.vtl')
    const username = chance.guid()
    const context = given.an_appsync_context({}, { userId: username, nextToken: null, limit: 26 })
    expect(() => when.we_invoke_an_appSync_template(templatePath, context)).toThrowError("Max limit is 25")
  })
})