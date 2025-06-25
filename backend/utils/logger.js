import { createLogger, format, transports } from 'winston';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    format.json(),
    format((info) => {
      info.requestId = info.requestId || uuidv4();
      return info;
    })()
  ),
  defaultMeta: { service: 'netdiag-api' },
  transports: [
    new transports.File({
      filename: '/var/log/netdiag/error.log',
      level: 'error',
    }),
    new transports.File({
      filename: '/var/log/netdiag/combined.log',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.simple(),
    })
  );
}

export default logger;
