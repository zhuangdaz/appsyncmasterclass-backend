const middy = require('@middy/core')
const ssm = require('@middy/ssm')
const chance = require('chance').Chance()
const { SearchModes } = require('../lib/constants')
const { STAGE } = process.env
const { initUsersIndex, initTweetsIndex } = require('../lib/algolia')

module.exports.handler = middy(async (event, context) => {
  const userId = event.identity.username
  const { hashTag, mode, limit, nextToken } = event.arguments
  switch (mode) {
    case SearchModes.LATEST:
      return await searchLatest(context, hashTag, limit, nextToken)
    case SearchModes.PEOPLE:
      return await searchPeople(context, hashTag, limit, nextToken, userId)      
    default:
      throw new Error("Only 'People' and 'Latest' modes are supported for now");
  }
}).use(ssm({
  fetchData: {
    ALGOLIA_APP_ID: `/${STAGE}/algolia-app-id`,
    ALGOLIA_WRITE_KEY: `/${STAGE}/algolia-admin-key`
  },
  setToContext: true,
  cacheExpiry: 5 * 60 * 1000 // 5 mins
})).onError(async (request) => {
  throw request.error
})

async function searchPeople(context, hashTag, limit, nextToken, userId) {
  const index = await initUsersIndex(context.ALGOLIA_APP_ID, context.ALGOLIA_WRITE_KEY, STAGE)
  const searchParams = parseNextToken(nextToken) || {
    hitsPerPage: limit,
    page: 0
  }

  const query = hashTag.replace('#', '')
  const { hits, page, nbPages } = await index.search(query, searchParams)
  hits.forEach(x => {
    x.__typename = x.id === userId ? 'MyProfile' : 'OtherProfile'
  })

  let nextSearchParams
  if (page + 1 >= nbPages) {
    nextSearchParams = null
  } else {
    nextSearchParams = Object.assign({}, searchParams, { page: page + 1 })
  }

  return {
    results: hits,
    nextToken: genNextToken(nextSearchParams)
  }
}

async function searchLatest(context, hashTag, limit, nextToken) {
  const index = await initTweetsIndex(context.ALGOLIA_APP_ID, context.ALGOLIA_WRITE_KEY, STAGE)
  const searchParams = parseNextToken(nextToken) || {
    facetFilters: [`hashTags:${hashTag}`],
    hitsPerPage: limit,
    page: 0
  }
  const { hits, page, nbPages } = await index.search(query, searchParams)

  let nextSearchParams
  if (page + 1 >= nbPages) {
    nextSearchParams = null
  } else {
    nextSearchParams = Object.assign({}, searchParams, { page: page + 1 })
  }

  return {
    results: hits,
    nextToken: genNextToken(nextSearchParams)
  }
}

function genNextToken(searchParams) {
  if (!searchParams) {
    return null
  }

  const payload = Object.assign({}, searchParams, { random: chance.string({ length: 16 }) })
  const token = JSON.stringify(payload)
  return Buffer.from(token).toString('base64')
}

function parseNextToken(nextToken) {
  if (!nextToken) {
    return null
  }
  const token = Buffer.from(nextToken, 'base64').toString()
  const searchParams = JSON.parse(token)
  delete searchParams.random

  return searchParams
}