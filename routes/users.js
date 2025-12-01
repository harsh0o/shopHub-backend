const express = require('express');
const router = express.Router();
const {
    getUsers,
    getAdmins,
    getCustomers,
    getUserByUuid,
    updateUser,
    promoteToAdmin,
    demoteToCustomer,
    deleteUser
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidParam, userUpdateValidation, paginationQuery } = require('../middleware/validation');

// All routes are Super Admin only
router.use(authenticate, authorize('super_admin'));

router.get('/', paginationQuery, getUsers);
router.get('/admins', paginationQuery, getAdmins);
router.get('/customers', paginationQuery, getCustomers);
router.get('/:uuid', uuidParam, getUserByUuid);
router.put('/:uuid', uuidParam, userUpdateValidation, updateUser);
router.patch('/:uuid/promote', uuidParam, promoteToAdmin);
router.patch('/:uuid/demote', uuidParam, demoteToCustomer);
router.delete('/:uuid', uuidParam, deleteUser);

module.exports = router;
