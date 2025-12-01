const { getPool } = require('../config/database');

class Token {
    static async saveRefreshToken(userId, token, expiresAt) {
        const pool = getPool();
        await pool.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expiresAt]
        );
    }

    static async findRefreshToken(token) {
        const pool = getPool();
        const [rows] = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
            [token]
        );
        return rows[0] || null;
    }

    static async deleteRefreshToken(token) {
        const pool = getPool();
        await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
    }

    static async deleteUserTokens(userId) {
        const pool = getPool();
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
    }

    static async cleanExpiredTokens() {
        const pool = getPool();
        await pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    }
}

module.exports = Token;
