export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REDIS_HOST: string
      REDIS_PORT: number
      REDIS_PW: string
      REDIS_URL: string
      ENV: 'test' | 'dev' | 'prod'
    }
  }
}
