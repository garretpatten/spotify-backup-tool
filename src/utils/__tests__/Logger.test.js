// Mock the config module
jest.mock('../../config/config', () => ({
  logging: { level: 'info' }
}));

const Logger = require('../Logger');

describe('Logger', () => {
  let logger;
  let consoleSpy;
  let mockConfig;

  beforeEach(() => {
    consoleSpy = {
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      log: jest.spyOn(console, 'log').mockImplementation()
    };

    // Reset environment
    delete process.env.LOG_LEVEL;

    // Reset the mock
    jest.resetModules();
    mockConfig = require('../../config/config');
    mockConfig.logging.level = 'info';

    logger = new Logger();
  });

  afterEach(() => {
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.log.mockRestore();
  });

  describe('log levels', () => {
    it('should log error messages by default', () => {
      logger.error('Test error');
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR] Test error'));
    });

    it('should log warn messages by default', () => {
      logger.warn('Test warning');
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN] Test warning'));
    });

    it('should log info messages by default', () => {
      logger.info('Test info');
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[INFO] Test info'));
    });

    it('should not log debug messages by default', () => {
      logger.debug('Test debug');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should log debug messages when LOG_LEVEL is debug', () => {
      mockConfig.logging.level = 'debug';
      const debugLogger = new Logger();

      debugLogger.debug('Test debug');
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] Test debug'));
    });

    it('should not log info messages when LOG_LEVEL is warn', () => {
      mockConfig.logging.level = 'warn';
      const warnLogger = new Logger();

      warnLogger.info('Test info');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    it('should include timestamp in messages', () => {
      logger.info('Test message');

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] Test message$/);
    });

    it('should include log level in messages', () => {
      logger.info('Test message');
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    });

    it('should handle multiple arguments', () => {
      logger.info('Test message', 'arg1', 'arg2');

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toContain('Test message arg1 arg2');
    });

    it('should stringify objects in arguments', () => {
      const obj = { key: 'value' };
      logger.info('Test message', obj);

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toContain('Test message');
      expect(logCall).toContain('"key": "value"');
    });
  });
});
