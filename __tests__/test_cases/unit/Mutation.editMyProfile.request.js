const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const path = require('path')

describe('Mutatation.editMyProfile.request template', () => {
  it("should use 'newProfile' field in expression values", () => {
    const templatePath = path.resolve(__dirname, '../../../mapping-templates/Mutation.editMyProfile.request.vtl')
    const username = chance.guid()
    const newProfile = {
      name: "Fifi's dad",
      imageURL: null,
      backgroundImageURL: null,
      bio: "test",
      location: null,
      website: null,
      birthDate: null
    }
    const context = given.an_appsync_context({ username }, { newProfile })
    const result = when.we_invoke_an_appSync_template(templatePath, context)

    expect(result).toEqual({
      "version" : "2018-05-29",
      "operation" : "UpdateItem",
      "key": {
          "id": {
            S: username
          }
      },
      "update" : {
        "expression" : "set #name = :name, imageURL = :imageURL, backgroundImageURL = :backgroundImageURL, bio = :bio, #location = :location, website = :website, birthDate = :birthDate",
        "expressionNames" : {
          "#name" : "name",
          "#location": "location"
        },
        "expressionValues" : {
          ":name" : {
            S: "Fifi's dad"
          }, 
          ":imageURL" : {
            NULL: true
          }, 
          ":backgroundImageURL" : {
            NULL: true
          }, 
          ":bio" : {
            S: "test"
          }, 
          ":location" : {
            NULL: true
          }, 
          ":website" : {
            NULL: true
          }, 
          ":birthDate" : {
            NULL: true
          }
        }
      },
      "condition" : {
          "expression" : "attribute_exists(id)"
      }
    })
  })
})