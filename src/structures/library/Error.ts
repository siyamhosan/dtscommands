export class ValidationError extends Error {
  public ttl: number

  /**
   *
   * @param message Message to send
   * @param ttl Time to live in seconds
   */
  constructor(message: string, ttl = 25) {
    super(message)
    this.name = 'ValidationError'
    this.message = message
    this.stack = (<any>new Error()).stack
    this.ttl = ttl
  }
}
