require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe("Given authenticated users, userA, userB and userC", () => {
  let userA, userB, userC, userAsTweet
  const text = chance.string({ length: 16 })
  beforeAll(async() => {
      userA = await given.an_authenticated_user()
      userB = await given.an_authenticated_user()
      userC = await given.an_authenticated_user()
      userAsTweet = await when.a_user_calls_tweet(userA, text)
  })

  describe("When userB replies to userA's tweet", () => {
    let userBsReply
    const replyText = chance.string({length: 16})
    beforeAll(async () => {
      userBsReply = await when.a_user_calls_reply(userB, userAsTweet.id, replyText)
    })

    it("userB should see his reply when calling getTweets", async () => {
      const { tweets } = await when.a_user_calls_getTweets(userB, userB.username, 25)

      expect(tweets.length).toEqual(1)
      expect(tweets[0]).toMatchObject({
        profile: {
          id: userB.username,
          tweetsCount: 1
        },
        inReplyToTweet: {
          id: userAsTweet.id,
          replies: 1
        },
        inReplyToUsers: [
          {
            id: userA.username
          }
        ]
      })
    })

    it("userB should see his reply when calling getMyTimeline", async () => {
      const { tweets } = await when.a_user_calls_getMyTimeline(userB, 25)
      expect(tweets.length).toEqual(1)
      expect(tweets[0]).toMatchObject({
        profile: {
          id: userB.username,
          tweetsCount: 1
        },
        inReplyToTweet: {
          id: userAsTweet.id,
          replies: 1
        },
        inReplyToUsers: [
          {
            id: userA.username
          }
        ]
      })
    })

    describe("When userC replies to userB's reply", () => {
      let userCsReply
      const replyText = chance.string({ length: 16 })
      beforeAll(async () => {
        console.log(`userBsReply: ${JSON.stringify(userBsReply)}`)
        userCsReply = await when.a_user_calls_reply(userC, userBsReply.id, replyText)
      })

      it("userC should see his reply when calling getTweets", async () => {
        const { tweets } = await when.a_user_calls_getTweets(userC, userC.username, 25)
  
        expect(tweets.length).toEqual(1)
        expect(tweets[0]).toMatchObject({
          profile: {
            id: userC.username,
            tweetsCount: 1
          },
          inReplyToTweet: {
            id: userBsReply.id,
            replies: 1
          },
          inReplyToUsers: expect.arrayContaining([
            expect.objectContaining({ id: userA.username }),
            expect.objectContaining({ id: userB.username })
          ])
        })
        expect(tweets[0].inReplyToUsers).toHaveLength(2)
      })
  
      it("userC should see his reply when calling getMyTimeline", async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(userC, 25)
        expect(tweets.length).toEqual(1)
        expect(tweets[0]).toMatchObject({
          profile: {
            id: userC.username,
            tweetsCount: 1
          },
          inReplyToTweet: {
            id: userBsReply.id,
            replies: 1
          },
          inReplyToUsers: expect.arrayContaining([
            expect.objectContaining({ id: userA.username }),
            expect.objectContaining({ id: userB.username })
          ])
        })
        expect(tweets[0].inReplyToUsers).toHaveLength(2)
      })
    })
  })

  describe("when userC retweets userA's tweet", () => {
    let userCsRetweet
    beforeAll(async() => {
      userCsRetweet = await when.a_user_calls_retweet(userC, userAsTweet.id)
    })

    describe("when userB replies to userC's retweet", () => {
      const replyText = chance.string({ length: 16 })
      beforeAll(async() => {
        await when.a_user_calls_reply(userB, userCsRetweet.id, replyText)
      })
      
      it("userB should see his reply when calling getTweets", async () => {
        const { tweets } = await when.a_user_calls_getTweets(userB, userB.username, 25)
  
        expect(tweets.length).toEqual(2)
        expect(tweets[0]).toMatchObject({
          profile: {
            id: userB.username,
            tweetsCount: 2
          },
          inReplyToTweet: {
            id: userCsRetweet.id
          },
          inReplyToUsers: expect.arrayContaining([
            expect.objectContaining({ id: userA.username }),
            expect.objectContaining({ id: userC.username })
          ])
        })
        expect(tweets[0].inReplyToUsers).toHaveLength(2)
      })
  
      it("userB should see his reply when calling getMyTimeline", async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(userB, 25)
        expect(tweets.length).toEqual(2)
        expect(tweets[0]).toMatchObject({
          profile: {
            id: userB.username,
            tweetsCount: 2
          },
          inReplyToTweet: {
            id: userCsRetweet.id
          },
          inReplyToUsers: expect.arrayContaining([
            expect.objectContaining({ id: userA.username }),
            expect.objectContaining({ id: userC.username })
          ])
        })
        expect(tweets[0].inReplyToUsers).toHaveLength(2)
      })
    })
  })
})