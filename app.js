import express from 'express';
import rateLimit from 'express-rate-limit';
import { tourRouter, userRouter } from './api/routes/index.js';
import AppError from './api/utils/error.js';
import errorHandler from './api/controllers/errorController.js';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// Instantiate the App
export const app = express();

// Middlewares
// set security http headers
app.use(helmet());

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

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

// Error
app.all('*', (_, res, next) => {
  next(new AppError('NOT FOUND!', 404));
});

app.use(errorHandler);
