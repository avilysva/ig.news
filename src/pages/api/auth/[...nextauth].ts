import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { query } from "faunadb";

import { faunadb } from "../../../services/faunadb";

export default NextAuth({
  secret: process.env.JWT_SECRET,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user",
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        await faunadb.query(
          query.If(
            query.Not(
              query.Exists(
                query.Match(
                  query.Index("user_by_email"),
                  query.Casefold(user.email)
                )
              )
            ),
            query.Create(
              query.Collection("users"),
              {
                data: {
                  email: user.email
                }
              }
            ),
            query.Get(
              query.Match(
                query.Index("user_by_email"),
                query.Casefold(user.email)
              )
            )
          )
        )
        return true
      } catch {
        return false
      }
    }
  }
})