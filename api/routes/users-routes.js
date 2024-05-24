import { Router } from 'express';
import AuthController from '../controllers/authController.js';
import Users from '../controllers/usersController.js';

const users = new Users();
const auth = new AuthController();
const router = Router();

// account routes
router.post('/signup', auth.signup);
router.post('/login', auth.validateLoginAttempt, auth.login);

// password routes
router.post('/forgotPassword', auth.forgotPassword);
router.patch('/resetPassword/:token', auth.resetPassword);
router.patch('/updatePassword', auth.protect, auth.updatePassword);

// current user control routes
router.patch('/updateMe', auth.protect, users.updateMe);
router.delete('/deleteMe', auth.protect, users.deleteMe);

// User Routes
router
  .route('/')
  .all(auth.protect)
  .get(users.getAllUsers)
  .post(users.createNewUser);

router
  .route('/:id')
  .all(auth.protect)
  .get(users.getUserByID)
  .put(users.updateUser)
  .delete(users.deleteUser);

export default router;
