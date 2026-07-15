import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin'

const withVanillaExtract = createVanillaExtractPlugin()

export default withVanillaExtract({
  outputFileTracingRoot: process.cwd(),
  reactCompiler: true,
})
