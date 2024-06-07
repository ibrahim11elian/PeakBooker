# PeakBooker App

This project is a tour booking application based on the Node.js course by Jonas Schmedtmann. I have added several improvements to enhance the application's functionality and user experience.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Error Handling](#error-handling)
- [Documentation](#documentation)

## Features

- **User Management:** Register, login, update profile, and deactivate accounts, forget password, reset password.
- **Tour Management:** Create, read, update, and delete tours, top 5 cheapest tours, tours statistics, busiest month in a year, tours within distance, closest tours from specific point(coordinate).
- **Booking Management:** Create, read, update, and delete bookings, checkout booking, tour bookings, user bookings.
- **Review Management:** Create, read, update, and delete reviews, tour reviews.
- **Payment Integration:** Integrated with Stripe for secure payments.
- **Photo Uploading:** Upload and resize user photos, stored in Firebase.
- **Email Notifications:** Automated emails for user registration, booking confirmations, and password reset, resend email confirmation.
- **Pagination support**.
- **Limit returned fields**.
- **Sort returned data**.
- **Error Handling:** Improved error handling for both development and production environments.
- **Logging:** Implemented request logging using Morgan and application logging using Winston.development and production environments.

## Technologies Used

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **Stripe API**
- **Firebase Storage**
- **Nodemailer**
- **JWT**
- **Multer**
- **Sharp (for image processing)**
- **Pug (for email templating)**
- **Morgan, Winston (for logging)**
- **ESLint, Prettier (for code quality)**

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ibrahim11elian/PeakBooker.git
   ```
2. Navigate to the project directory:
   ```bash
   cd booking-app
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Set up your environment variables by creating a .env file in the root directory and adding the following:

   ```.env
   PORT=3000

   NODE_ENV=development

   DB_STRING=

   DB_USER=
   DB_PASSWORD=


   HASH_SALT=

   JWT_SECRET=
   JWT_EXPIRES_IN=
   JWT_COOKIE_EXPIRES_IN=
   JWT_REFRESH_SECRET=

   # Mailtrap (development env)
   EMAIL_USERNAME=
   EMAIL_PASSWORD=
   EMAIL_HOST=
   EMAIL_PORT=

   # Sendgrid
   SENDGRID_USERNAME=
   SENDGRID_PASSWORD=

   # Company Email
   EMAIL_FROM=

   # Stripe Key
   STRIPE_KEY=
   WEBHOOK_SECRET=

   # Firebase
   FIREBASE_API_KEY=
   FIREBASE_AUTH_DOMAIN=
   FIREBASE_PROJECT_ID=
   FIREBASE_STORAGE_BUCKET=
   FIREBASE_MESSAGING_SENDER_ID=
   FIREBASE_APP_ID=1:
   FIREBASE_MEASUREMENT_ID=

   FIREBASE_PRIVATE_KEY=
   FIREBASE_CLIENT_EMAIL=
   ```

## Usage

1. Start the development server:
   ```bash
   npm run start
   ```
2. The application will be running on `http://localhost:3000`.

## Error Handling

- **Development Mode**: Detailed error information including stack trace.
- **Production Mode**: Simplified error messages to prevent information leakage.
- **Custom Error Types**: Handling of specific errors like CastError, ValidationError, JWT errors, and MongoDB duplicate errors.

## Documentation

[API Documentation](https://documenter.getpostman.com/view/20023230/2sA3QterP1)
