import { Router } from 'express';
import authController from '../controllers/authController.js';
import BookingController from '../controllers/bookingController.js';

const router = Router({
  mergeParams: true,
});

const auth = new authController();
const bookings = new BookingController();

router.use(auth.protect);

router.get('/checkout-session/:tourId', bookings.getCheckoutSession);

router.use(auth.restrictTo('admin'));

router.route('/').get(bookings.getAllBookings).post(bookings.createBooking);

router
  .route('/:id')
  .get(bookings.getBooking)
  .patch(bookings.updateBooking)
  .delete(bookings.deleteBooking);

export default router;
