const algoliasearch = require('algoliasearch')

let usersIndex, tweetsIndex

const initUserIndex = async (appId, key, stage) => {
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
    tweetsIndex = client.initIndex(`users_${stage}`)
    await tweetsIndex.setSettings({
      searchableAttributes: [
        "text"
      ]
    })
  }
  return tweetsIndex
}

module.exports = {
  initUserIndex,
  initTweetsIndex
}