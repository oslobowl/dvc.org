const markdownParentFields = require('../markdown-content/fields.js')
const { resolveAuthorAvatar } = require('../../utils/resolvers')

async function createAuthorSchemaCustomization(api) {
  const {
    actions: { createTypes },
    schema: { buildObjectType }
  } = api
  const typeDefs = [
    buildObjectType({
      name: 'AuthorLink',
      fields: {
        url: 'String!',
        site: 'String',
        username: 'String'
      }
    }),
    buildObjectType({
      name: 'AuthorPosts',
      fields: {
        totalCount: 'Int!',
        nodes: '[BlogPost]'
      }
    }),
    buildObjectType({
      name: 'Author',
      interfaces: ['Node'],
      fields: {
        ...markdownParentFields,
        links: '[AuthorLink]',
        slug: 'String',
        avatar: {
          type: 'ImageSharp',
          resolve: resolveAuthorAvatar
        },
        posts: {
          type: 'AuthorPosts',
          args: {
            limit: {
              type: 'Int'
            }
          },
          async resolve(source, args, context) {
            const query = await context.nodeModel.findAll({
              query: {
                filter: {
                  author: {
                    sourcePath: {
                      eq: source.sourcePath
                    }
                  }
                },
                sort: {
                  fields: ['date'],
                  order: ['DESC']
                }
              },
              type: 'BlogPost'
            })

            return {
              totalCount: await query.totalCount(),
              nodes: query.entries.slice(0, args.limit)
            }
          }
        }
      }
    })
  ]
  createTypes(typeDefs)
}

module.exports = createAuthorSchemaCustomization
