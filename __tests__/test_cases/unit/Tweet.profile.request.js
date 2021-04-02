const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const path = require('path')

describe('Tweet.profile.request template', () => {
  it("shouldn't short-circuit if querying more than id", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Tweet.profile.request.vtl')
    const username = chance.guid()
    const info = {
      selectionSetList: ["id", "bio"]
    }
    const context = given.an_appsync_context({ username }, {}, {}, { creator: username }, info)
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    expect(result).toEqual({
      "version" : "2018-05-29",
      "operation" : "GetItem",
      "key" : {
          "id" : {
            "S": username
          }
      }
    })
  })

  it("should return MyProfile and id for current user if only asking for id", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Tweet.profile.request.vtl')
    const username = chance.guid()
    const info = {
      selectionSetList: ["id"]
    }
    const context = given.an_appsync_context({ username }, {}, {}, { creator: username }, info)
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    expect(result).toEqual({
      id: username,
      "__typename": "MyProfile"
    })
  })

  it("should return OtherProfile and id for other userId if only asking for id", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Tweet.profile.request.vtl')
    const username = chance.guid()
    const otherUserId = chance.guid()
    const info = {
      selectionSetList: ["id"]
    }
    const context = given.an_appsync_context({ username }, {}, {}, { creator: otherUserId }, info)
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    expect(result).toEqual({
      id: otherUserId,
      "__typename": "OtherProfile"
    })
  })
})