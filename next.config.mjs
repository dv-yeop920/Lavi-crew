import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin'

const withVanillaExtract = createVanillaExtractPlugin()

export default withVanillaExtract({
  experimental: {
    staleTimes: {
      dynamic: 1800,
    },
  },
  outputFileTracingRoot: process.cwd(),
  reactCompiler: true,
})
