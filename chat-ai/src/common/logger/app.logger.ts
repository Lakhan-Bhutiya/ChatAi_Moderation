export class AppLogger {
    static info(message: string, meta?: Record<string, any>) {
      console.log(
        JSON.stringify({
          level: 'info',
          time: new Date().toISOString(),
          message,
          ...meta,
        }),
      );
    }
  
    static warn(message: string, meta?: Record<string, any>) {
      console.warn(
        JSON.stringify({
          level: 'warn',
          time: new Date().toISOString(),
          message,
          ...meta,
        }),
      );
    }
  
    static error(message: string, meta?: Record<string, any>) {
      console.error(
        JSON.stringify({
          level: 'error',
          time: new Date().toISOString(),
          message,
          ...meta,
        }),
      );
    }
  }
  