const TweetTypes = {
  TWEET: 'Tweet',
  RETWEET: 'Retweet',
  REPLY: 'Reply'
}

const SearchModes = {
  LATEST: 'Latest',
  PEOPLE: 'People'
}

const DynamoDB = {
  MAX_BATCH_SIZE: 25
}

module.exports = {
  TweetTypes,
  SearchModes,
  DynamoDB
}