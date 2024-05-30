import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import AppError from './api/utils/error.js';
import errorHandler from './api/controllers/errorController.js';
import { reviewRouter, tourRouter, userRouter } from './api/routes/index.js';
import logger from './api/utils/logger.js';

// Instantiate the App
export const app = express();

// Middlewares
// set security http headers
app.use(helmet());

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Use morgan middleware for logging HTTP requests
// Custom Morgan format string for JSON logging
app.use(
  morgan(
    (tokens, req, res) => {
      return JSON.stringify({
        remoteAddr: tokens['remote-addr'](req, res),
        date: tokens['date'](req, res, 'clf'),
        method: tokens['method'](req, res),
        url: tokens['url'](req, res),
        httpVersion: tokens['http-version'](req, res),
        status: tokens['status'](req, res),
        contentLength: tokens['res'](req, res, 'content-length'),
        referrer: tokens['referrer'](req, res),
        userAgent: tokens['user-agent'](req, res),
        responseTime: tokens['response-time'](req, res),
      });
    },
    {
      stream: {
        write: (message) => logger.info(JSON.parse(message)),
      },
    },
  ),
);

// Data sanitization against NoSQL injection
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xss());
// Prevent parameter pollution ex.(?sort=price&sort=duration)
app.use(
  hpp({
    whitelist: [
      'duration',
      'price',
      'difficulty',
      'rating',
      'ratingsAverage',
      'ratingsQuantity',
    ],
  }),
);

// Limit requests from the same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Root Route
app.get('/', (_, res) => {
  res.status(200).send('<h2> Hello from the server side </h2>');
});

app.use(express.static('./dev-data/img'));

// App Routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Error
app.all('*', (_, res, next) => {
  next(new AppError('NOT FOUND!', 404));
});

app.use(errorHandler);
