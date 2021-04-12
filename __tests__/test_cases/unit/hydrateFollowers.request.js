const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const path = require('path')

describe('hydrateFollowers.request template', () => {
  it("should return empty list if prev.result.relationships is empty", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/hydrateFollowers.request.vtl')
    const prev = {
      result: {
        relationships: []
      }
    }
    const context = given.an_appsync_context({}, {}, {}, {}, {}, prev)
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    
    expect(result).toEqual([])
  })

  it("should convert relationships to BatchGetItem key", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/hydrateFollowers.request.vtl')
    
    const userId = chance.guid()
    const otherUserId = chance.guid()
    const sk = `FOLLOWS_${otherUserId}`
    const prev = {
      result: {
        relationships: [{
          userId,
          sk,
          otherUserId
        }]
      }
    }
    const context = given.an_appsync_context({}, {}, {}, {}, {}, prev)
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    
    expect(result).toEqual(
      {
        "version" : "2018-05-29",
        "operation" : "BatchGetItem",
        "tables" : {
            "${UsersTable}": {
                "keys": [{
                  "id": { 
                    "S": userId 
                  }
                }],
                "consistentRead": false
            }
        }
    })
  })
})