import path from 'path';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import AppError from './api/utils/error.js';
import errorHandler from './api/controllers/errorController.js';
import {
  bookingRouter,
  reviewRouter,
  tourRouter,
  userRouter,
} from './api/routes/index.js';
import logger from './api/utils/logger.js';
import folderBuilder from './api/utils/folder-builder.js';
import BookingController from './api/controllers/bookingController.js';

// Instantiate the App
export const app = express();
app.enable('trust proxy');
// Middlewares
// set security http headers
app.use(helmet());

app.use(cors());

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

// Stripe webhook
// it's here because it work with streams not json
// so we moved it here before the body parser middleware
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  new BookingController().webhookCheckout,
);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Compress middleware
app.use(compression());

// Root Route
app.get('/', (_, res) => {
  res.status(200).send('<h2> Hello from the server side </h2>');
});

// util function make suer that the uploads folder exists
folderBuilder();

// eslint-disable-next-line no-undef
const staticPath = path.join(process.cwd(), 'uploads');
app.use('/static', express.static(staticPath));
// App Routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Error
app.all('*', (_, res, next) => {
  next(new AppError('NOT FOUND!', 404));
});

app.use(errorHandler);
