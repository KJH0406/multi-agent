import { ApolloServer, gql } from "apollo-server"

let tweets = [
  {
    id: "1",
    text: "first hello",
  },
  {
    id: "2",
    text: "second hello",
  },
]

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
  }
  type Tweet {
    id: ID!
    text: String!
    author: User
  }
  type Query {
    allTweets: [Tweet!]!
    tweet(id: ID!): Tweet
  }

  # Mutations란 서버 데이터를 업데이트하도록 서버에 요청을 보내는 동작(POST, DELETE, PUT)
  type Mutation {
    postTweet(text: String!, userId: ID!): Tweet!
    deleteTweet(id: ID!): Boolean!
  }
`

const resolvers = {
  Query: {
    allTweets() {
      return tweets
    },
    tweet(root, { id }) {
      return tweets.find((tweet) => tweet.id === id)
    },
  },
  Mutation: {
    postTweet(_, { text, userId }) {
      const newTweet = {
        id: tweets.length + 1,
        text,
      }
      tweets.push(newTweet) // 실제로는 DB에 넣어야함.
      return newTweet
    },

    deleteTweet(_, { id }) {
      const tweet = tweets.find((tweet) => tweet.id === id)
      if (!tweet) return false

      tweets = tweets.filter((tweet) => tweet.id !== id)
      return true
    },
  },
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(`Running on ${url}`)
})
