require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()

describe("Given two authenticated users", () => {
  let userA, userB
  beforeAll(async() => {
      userA = await given.an_authenticated_user()
      userB = await given.an_authenticated_user()
  })

  describe("When userA sends a DM to userB", () => {
    let conversation
    const text = chance.string( { length: 16 })

    beforeAll(async() => {
      conversation = await when.a_user_calls_sendDirectMessage(userA, userB.username, text)
    })

    it("Their last message should be updated", () => {
      expect(conversation.lastMessage).toEqual(text)
    })

    describe("When userB sends a DM to userA", () => {
      let conversation2
      const text2 = chance.string( { length: 16 })

      beforeAll(async() => {
        conversation2 = await when.a_user_calls_sendDirectMessage(userB, userA.username, text2)
      })
  
      it("Their last message and last modified time should both be updated", () => {
        expect(conversation2.lastMessage).toEqual(text2)
        expect(conversation2.lastModified > conversation.lastModified).toEqual(true)
      })
    })
  })
})