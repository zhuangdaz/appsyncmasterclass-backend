require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')

describe("Given authenticated users, userA and userB", () => {
  let userA, userB, userAsProfile, userBsProfile
  beforeAll(async() => {
      userA = await given.an_authenticated_user()
      userB = await given.an_authenticated_user()
      userAsProfile = await when.a_user_calls_getMyProfile(userA)
      userBsProfile = await when.a_user_calls_getMyProfile(userB)
  })

  describe("When userA follows userB", () => {
    beforeAll(async () => {
      await when.a_user_calls_follow(userA, userB.username)
    })

    it("userA should see following as true when viewing userB's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)
      expect(following).toBe(true)
      expect(followedBy).toBe(false)
    })

    it("userB should see followedBy as true when viewing userA's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)
      expect(following).toBe(false)
      expect(followedBy).toBe(true)
    })
  })

  describe("When userB follows back userA", () => {
    beforeAll(async () => {
      await when.a_user_calls_follow(userB, userA.username)
    })

    it("userA should see following and followedBy as true when viewing userB's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)
      expect(following).toBe(true)
      expect(followedBy).toBe(true)
    })

    it("userB should see following and followedBy as true when viewing userA's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)
      expect(following).toBe(true)
      expect(followedBy).toBe(true)
    })
  })
})