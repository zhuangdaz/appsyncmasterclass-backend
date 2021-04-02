const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const path = require('path')

describe('Reply.inReplyToUsers.request template', () => {
  it("shouldn't short-circuit if querying more than id", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Reply.inReplyToUsers.request.vtl')
    const username = chance.guid()
    const info = {
      selectionSetList: ["id", "bio"]
    }
    const context = given.an_appsync_context({ username }, {}, {}, { inReplyToUserIds: [username] }, info)
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    expect(result).toEqual(
      {
        "version" : "2018-05-29",
        "operation" : "BatchGetItem",
        "tables" : {
            "${UsersTable}": {
                "keys": [{
                  "id": { 
                    "S": username 
                  }
                }],
                "consistentRead": false
            }
        }
      }
    )
  })

  it("should short-circuit if querying just id", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Reply.inReplyToUsers.request.vtl')
    const username1 = chance.guid()
    const username2 = chance.guid()
    const info = {
      selectionSetList: ["id"]
    }
    const context = given.an_appsync_context({ username: username1 }, {}, {}, { inReplyToUserIds: [username1, username2] }, info)
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    expect(result).toEqual(
      [
        {
          id: username1,
          __typename: "MyProfile"
        },
        {
          id: username2,
          __typename: "OtherProfile"
        }
      ]
    )
  })


  it("should short-circuit and return empty list if source.inReplyToUserIds is empty", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Reply.inReplyToUsers.request.vtl')
    
    const username = chance.guid()
    const context = given.an_appsync_context({ username }, {}, { id: username }, { inReplyToUserIds: [] })
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    
    expect(result).toEqual([])
  })

  it("should convert Reply inReplyToUserIds to BatchGetItem keys", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Reply.inReplyToUsers.request.vtl')
    
    const username = chance.guid()
    const context = given.an_appsync_context({ username }, {}, { id: username }, { inReplyToUserIds: [username] })
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    
    expect(result).toEqual(
      {
        "version" : "2018-05-29",
        "operation" : "BatchGetItem",
        "tables" : {
            "${UsersTable}": {
                "keys": [{
                  "id": { 
                    "S": username 
                  }
                }],
                "consistentRead": false
            }
        }
      }
    )
  })
})