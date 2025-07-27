/* tslint:disable */
/* eslint-disable */
declare module "node-config-ts" {
  interface IConfig {
    server: Server
    database: Database
    cache: Cache
    sentry: Sentry
    email: Email
  }
  interface Email {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
  }
  interface Sentry {
    enabled: boolean
    dsn: string
    tracesSampleRate: number
    profilesSampleRate: number
    environment: string
  }
  interface Cache {
    global: boolean
    host: string
    port: number
    ttl: number
  }
  interface Database {
    type: string
    host: string
    port: number
    username: string
    password: string
    database: string
    synchronize: boolean
    logging: boolean
  }
  interface Server {
    port: number
    host: string
    debug: boolean
    saltRounds: number
    jwtSecret: string
    jwtExpiresIn: string
  }
  export const config: Config
  export type Config = IConfig
}
