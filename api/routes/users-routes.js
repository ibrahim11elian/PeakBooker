import { Router } from 'express';
import AuthController from '../controllers/authController.js';
import Users from '../controllers/usersController.js';
import bookingRouter from './booking-routes.js';

const users = new Users();
const auth = new AuthController();
const router = Router();

router.use('/:userId/bookings', bookingRouter);

// account routes
router.post('/signup', auth.signup);
router.post('/login', auth.validateLoginAttempt, auth.login);
router.delete('/logout', auth.logout);
router.delete('/logout-all', auth.logoutAll);
router.get('/verify-email', auth.verifyEmail);
router.post('/resend-verification-email', auth.resendVerificationEmail);
router.post('/refresh-token', auth.refreshToken);

// password routes
router.post('/forgotPassword', auth.forgotPassword);
router.patch('/resetPassword/:token', auth.resetPassword);

// adding protect middleware to all the routes that coming after that
router.use(auth.protect);

// current user control routes
router.get('/me', users.getMe, users.getUserByID);
router.patch('/updatePassword', auth.updatePassword);
router.patch(
  '/updateMe',
  users.uploadUserPhoto,
  users.resizeUserPhoto,
  users.handleFileUpload, // upload to Firebase
  users.updateMe,
);
router.delete('/deleteMe', users.deleteMe);

// adding restriction to all routes that are coming after that
router.use(auth.restrictTo('admin'));

router.route('/').get(users.getAllUsers);
router
  .route('/:id')
  .get(users.getUserByID)
  .patch(users.updateUser)
  .delete(users.deleteUser);

export default router;
