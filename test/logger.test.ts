// Tests for Logger utility

import { Logger, LogLevel } from '../src/shared/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger('TestLogger', LogLevel.DEBUG);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log debug messages when level allows', () => {
    logger.debug('Debug message');
    expect(consoleSpy).toHaveBeenCalledWith('[TestLogger] Debug message');
  });

  it('should log info messages when level allows', () => {
    logger.info('Info message');
    expect(consoleSpy).toHaveBeenCalledWith('[TestLogger] Info message');
  });

  it('should not log debug messages when level is too high', () => {
    const highLevelLogger = new Logger('TestLogger', LogLevel.ERROR);
    highLevelLogger.debug('Debug message');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should handle multiple arguments', () => {
    logger.info('Message with', 'multiple', 'args', 123);
    expect(consoleSpy).toHaveBeenCalledWith('[TestLogger] Message with', 'multiple', 'args', 123);
  });
});
