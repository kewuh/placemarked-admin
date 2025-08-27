// Production logging utility
export class Logger {
  private static isProduction = import.meta.env.PROD;
  
  static info(message: string, data?: any) {
    if (!this.isProduction) {
      console.log(`[INFO] ${message}`, data || '');
    }
    // In production, you might want to send to a logging service
  }
  
  static error(message: string, error?: any) {
    if (!this.isProduction) {
      console.error(`[ERROR] ${message}`, error || '');
    } else {
      // In production, send to error tracking service
      console.error(`[ERROR] ${message}`);
    }
  }
  
  static warn(message: string, data?: any) {
    if (!this.isProduction) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }
  
  static debug(message: string, data?: any) {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
}
