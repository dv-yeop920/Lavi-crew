import 'server-only'

export function isPortfolioDemoEnabled(environment: NodeJS.ProcessEnv = process.env) {
  return environment.LAVI_ENABLE_DEMO_FIXTURES === 'true'
}
