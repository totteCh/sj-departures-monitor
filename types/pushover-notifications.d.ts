declare module 'pushover-notifications' {
  interface PushoverMessage {
    message: string
    title?: string
    sound?: string
    priority?: number
    [key: string]: any // Allow additional optional fields
  }

  class Pushover {
    constructor(options: { user: string; token: string })
    send(
      message: PushoverMessage,
      callback?: (error: Error | null, response: any) => void,
    ): void
  }

  export = Pushover
}
