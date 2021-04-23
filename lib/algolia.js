const algoliasearch = require('algoliasearch')

let usersIndex, tweetsIndex

const initUsersIndex = async (appId, key, stage) => {
  if (!usersIndex) {
    const client = algoliasearch(appId, key)
    usersIndex = client.initIndex(`users_${stage}`)
    await usersIndex.setSettings({
      searchableAttributes: [
        "name", "screenName"
      ]
    })
  }
  return usersIndex
}

const initTweetsIndex = async (appId, key, stage) => {
  if (!tweetsIndex) {
    const client = algoliasearch(appId, key)
    tweetsIndex = client.initIndex(`tweets_${stage}`)
    await tweetsIndex.setSettings({
      searchableAttributes: [
        "text"
      ]
    })
  }
  return tweetsIndex
}

module.exports = {
  initUsersIndex,
  initTweetsIndex
}