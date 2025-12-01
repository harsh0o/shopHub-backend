const { getPool } = require('../config/database');
const { generateUniqueSlug } = require('../utils/slug');

class Category {
    static async findAll(activeOnly = false) {
        const pool = getPool();
        let query = 'SELECT * FROM categories';
        if (activeOnly) query += ' WHERE is_active = TRUE';
        query += ' ORDER BY name ASC';
        
        const [rows] = await pool.query(query);
        return rows;
    }

    static async findById(id) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async findBySlug(slug) {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [slug]);
        return rows[0] || null;
    }

    static async create(categoryData) {
        const pool = getPool();
        const slug = await generateUniqueSlug(pool, 'categories', categoryData.name);
        
        const [result] = await pool.query(
            'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
            [categoryData.name, slug, categoryData.description || null]
        );
        
        return { id: result.insertId, slug };
    }

    static async update(id, categoryData) {
        const pool = getPool();
        const fields = [];
        const values = [];

        if (categoryData.name) {
            fields.push('name = ?');
            values.push(categoryData.name);
            const slug = await generateUniqueSlug(pool, 'categories', categoryData.name, id);
            fields.push('slug = ?');
            values.push(slug);
        }
        if (categoryData.description !== undefined) {
            fields.push('description = ?');
            values.push(categoryData.description);
        }
        if (typeof categoryData.is_active === 'boolean') {
            fields.push('is_active = ?');
            values.push(categoryData.is_active);
        }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
        
        return this.findById(id);
    }

    static async delete(id) {
        const pool = getPool();
        const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Category;
