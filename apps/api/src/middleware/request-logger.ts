import type { RequestHandler } from 'express';
import { logger } from '../config/logger.js';

export const requestLogger: RequestHandler = (req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
};
