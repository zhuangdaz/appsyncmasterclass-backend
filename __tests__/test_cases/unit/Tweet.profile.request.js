const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const path = require('path')

describe('Tweet.profile.request template', () => {
  it("should return MyProfile for current user", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Tweet.profile.response.vtl')
    const username = chance.guid()
    const context = given.an_appsync_context({ username }, {}, { id: username })
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    expect(result).toEqual({
      id: username,
      "__typename": "MyProfile"
    })
  })

  it("should return OtherProfile for other userId", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Tweet.profile.response.vtl')
    const username = chance.guid()
    const otherUserId = chance.guid()
    const context = given.an_appsync_context({ username }, {}, { id: otherUserId })
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    expect(result).toEqual({
      id: otherUserId,
      "__typename": "OtherProfile"
    })
  })
})