import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: '../backend/schema.gql',
  documents: ['src/**/*.graphql'],
  generates: {
    'src/shared/api/gql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
        scalars: { DateTime: { input: 'string', output: 'string' } },
      },
    },
  },
}

export default config
