import { Logger } from '@nestjs/common';

/** Logger mínimo reutilizable fuera de contextos Nest (arranque, datos). */
export class AppLogger {
  private static readonly logger = new Logger('PlazaEspana');
  static log(message: string, context?: string): void {
    this.logger.log(context ? `[${context}] ${message}` : message);
  }
  static warn(message: string, context?: string): void {
    this.logger.warn(context ? `[${context}] ${message}` : message);
  }
  static error(message: string, context?: string): void {
    this.logger.error(context ? `[${context}] ${message}` : message);
  }
}
