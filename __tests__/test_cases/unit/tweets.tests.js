require('dotenv').config()
const { extractHashTags } = require('../../../lib/tweets')
const chance = require('chance').Chance()

describe('When extractHashTags runs', () => {
  it('Returns hashTags within the text', () => {
    const hashTag = `#${chance.string({ length: 16, alpha: true })}`
    const text = `This is a test text with hashtags: ${hashTag}`
    const hashTags = extractHashTags(text)
    expect(hashTags).toHaveLength(1)
    expect(hashTags).toContain(hashTag)
  })
})