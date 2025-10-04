const config = require('../config/config');

class Logger {
  constructor() {
    this.logLevel = config.logging.level;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (args.length > 0) {
      return `${prefix} ${message} ${args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')}`;
    }

    return `${prefix} ${message}`;
  }

  error(message, ...args) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, ...args));
    }
  }

  warn(message, ...args) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, ...args));
    }
  }

  info(message, ...args) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, ...args));
    }
  }

  debug(message, ...args) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, ...args));
    }
  }
}

module.exports = Logger;
