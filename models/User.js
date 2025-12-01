const { getPool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
    static async findByEmail(email) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    }

    static async findById(id) {
        const pool = getPool();
        const [rows] = await pool.query(
            'SELECT id, uuid, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async findByUuid(uuid) {
        const pool = getPool();
        const [rows] = await pool.query(
            'SELECT id, uuid, name, email, role, is_active, created_at, updated_at FROM users WHERE uuid = ?',
            [uuid]
        );
        return rows[0] || null;
    }

    static async create(userData) {
        const pool = getPool();
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const uuid = uuidv4();
        
        const [result] = await pool.query(
            'INSERT INTO users (uuid, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [uuid, userData.name, userData.email, hashedPassword, userData.role || 'customer']
        );
        
        return { id: result.insertId, uuid };
    }

    static async comparePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    static async findAll(options = {}) {
        const pool = getPool();
        const { page = 1, limit = 10, role, search, excludeRole } = options;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT id, uuid, name, email, role, is_active, created_at, updated_at FROM users WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const params = [];
        const countParams = [];

        if (role) {
            query += ' AND role = ?';
            countQuery += ' AND role = ?';
            params.push(role);
            countParams.push(role);
        }

        if (excludeRole) {
            query += ' AND role != ?';
            countQuery += ' AND role != ?';
            params.push(excludeRole);
            countParams.push(excludeRole);
        }

        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ?)';
            countQuery += ' AND (name LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        const [countResult] = await pool.query(countQuery, countParams);

        return {
            users: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async update(uuid, userData) {
        const pool = getPool();
        const fields = [];
        const values = [];

        if (userData.name) {
            fields.push('name = ?');
            values.push(userData.name);
        }
        if (userData.role) {
            fields.push('role = ?');
            values.push(userData.role);
        }
        if (typeof userData.is_active === 'boolean') {
            fields.push('is_active = ?');
            values.push(userData.is_active);
        }

        if (fields.length === 0) return null;

        values.push(uuid);
        await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE uuid = ?`, values);
        
        return this.findByUuid(uuid);
    }

    static async delete(uuid) {
        const pool = getPool();
        const [result] = await pool.query('DELETE FROM users WHERE uuid = ?', [uuid]);
        return result.affectedRows > 0;
    }
}

module.exports = User;
