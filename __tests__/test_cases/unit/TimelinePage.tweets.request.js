const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const path = require('path')

describe('TimelinePage.tweets.request template', () => {
  it("should return empty list if source.tweets is empty", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/TimelinePage.tweets.request.vtl')
    
    const username = chance.guid()
    const context = given.an_appsync_context({ username }, {}, { id: username }, { tweets: [] })
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    
    expect(result).toEqual([])
  })

  it("should convert timeline tweets to BatchGetItem key", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/TimelinePage.tweets.request.vtl')
    
    const username = chance.guid()
    const tweetId = chance.guid()
    const context = given.an_appsync_context({ username }, {}, { id: username }, { tweets: [{tweetId}] })
    const result = when.we_invoke_an_appSync_template(templatePath, context)
    
    expect(result).toEqual(
      {
        "version" : "2018-05-29",
        "operation" : "BatchGetItem",
        "tables" : {
            "${TweetsTable}": {
                "keys": [{
                  "id": { 
                    "S": tweetId 
                  }
                }],
                "consistentRead": false
            }
        }
    })
  })
})