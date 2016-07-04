import winston from 'winston';
import util from 'util';

export const debuglog = util.debuglog('cmdcli');

export const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});
