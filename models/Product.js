const { getPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { generateUniqueSlug } = require('../utils/slug');

class Product {
    static async create(productData, userId) {
        const pool = getPool();
        const uuid = uuidv4();
        const slug = await generateUniqueSlug(pool, 'products', productData.name);

        const [result] = await pool.query(
            `INSERT INTO products (uuid, name, slug, description, price, stock, category_id, created_by, 
             image_url, image_original_name, image_mime_type, image_size, meta_title, meta_description, meta_keywords) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                uuid, productData.name, slug, productData.description || null,
                productData.price, productData.stock || 0, productData.category_id || null, userId,
                productData.image_url || null, productData.image_original_name || null,
                productData.image_mime_type || null, productData.image_size || null,
                productData.meta_title || productData.name, productData.meta_description || productData.description,
                productData.meta_keywords || null
            ]
        );

        return { id: result.insertId, uuid, slug };
    }

    static async findByUuid(uuid) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT p.*, c.name as category_name, c.slug as category_slug, u.name as created_by_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN users u ON p.created_by = u.id
             WHERE p.uuid = ?`,
            [uuid]
        );
        return rows[0] || null;
    }

    static async findBySlug(slug) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT p.*, c.name as category_name, c.slug as category_slug, u.name as created_by_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN users u ON p.created_by = u.id
             WHERE p.slug = ? AND p.is_active = TRUE`,
            [slug]
        );
        return rows[0] || null;
    }

    // Public Landing Page - All active products
    static async findAllPublic(options = {}) {
        const pool = getPool();
        const { 
            page = 1, limit = 10, search, category_id, 
            sort_by = 'created_at', sort_order = 'desc',
            min_price, max_price 
        } = options;
        const offset = (page - 1) * limit;

        let query = `SELECT p.uuid, p.name, p.slug, p.description, p.price, p.stock, p.image_url,
                     p.meta_title, p.meta_description, c.name as category_name, c.slug as category_slug
                     FROM products p
                     LEFT JOIN categories c ON p.category_id = c.id
                     WHERE p.is_active = TRUE`;
        
        let countQuery = `SELECT COUNT(*) as total FROM products p WHERE p.is_active = TRUE`;
        const params = [];
        const countParams = [];

        if (search) {
            query += ` AND (MATCH(p.name, p.description, p.meta_keywords) AGAINST(? IN NATURAL LANGUAGE MODE) 
                      OR p.name LIKE ?)`;
            countQuery += ` AND (MATCH(p.name, p.description, p.meta_keywords) AGAINST(? IN NATURAL LANGUAGE MODE) 
                          OR p.name LIKE ?)`;
            params.push(search, `%${search}%`);
            countParams.push(search, `%${search}%`);
        }

        if (category_id) {
            query += ' AND p.category_id = ?';
            countQuery += ' AND p.category_id = ?';
            params.push(category_id);
            countParams.push(category_id);
        }

        if (min_price !== undefined) {
            query += ' AND p.price >= ?';
            countQuery += ' AND p.price >= ?';
            params.push(min_price);
            countParams.push(min_price);
        }

        if (max_price !== undefined) {
            query += ' AND p.price <= ?';
            countQuery += ' AND p.price <= ?';
            params.push(max_price);
            countParams.push(max_price);
        }

        const validSortFields = ['name', 'price', 'created_at'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';
        query += ` ORDER BY p.${sortField} ${sortDir} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        const [countResult] = await pool.query(countQuery, countParams);

        return {
            products: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    // Admin - Only products created by that admin
    static async findByCreator(userId, options = {}) {
        const pool = getPool();
        const { 
            page = 1, limit = 10, search, category_id, 
            sort_by = 'created_at', sort_order = 'desc',
            min_price, max_price 
        } = options;
        const offset = (page - 1) * limit;

        let query = `SELECT p.*, c.name as category_name, c.slug as category_slug
                     FROM products p
                     LEFT JOIN categories c ON p.category_id = c.id
                     WHERE p.created_by = ?`;
        
        let countQuery = `SELECT COUNT(*) as total FROM products p WHERE p.created_by = ?`;
        const params = [userId];
        const countParams = [userId];

        if (search) {
            query += ` AND (MATCH(p.name, p.description, p.meta_keywords) AGAINST(? IN NATURAL LANGUAGE MODE) 
                      OR p.name LIKE ?)`;
            countQuery += ` AND (MATCH(p.name, p.description, p.meta_keywords) AGAINST(? IN NATURAL LANGUAGE MODE) 
                          OR p.name LIKE ?)`;
            params.push(search, `%${search}%`);
            countParams.push(search, `%${search}%`);
        }

        if (category_id) {
            query += ' AND p.category_id = ?';
            countQuery += ' AND p.category_id = ?';
            params.push(category_id);
            countParams.push(category_id);
        }

        if (min_price !== undefined) {
            query += ' AND p.price >= ?';
            countQuery += ' AND p.price >= ?';
            params.push(min_price);
            countParams.push(min_price);
        }

        if (max_price !== undefined) {
            query += ' AND p.price <= ?';
            countQuery += ' AND p.price <= ?';
            params.push(max_price);
            countParams.push(max_price);
        }

        const validSortFields = ['name', 'price', 'created_at'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';
        query += ` ORDER BY p.${sortField} ${sortDir} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        const [countResult] = await pool.query(countQuery, countParams);

        return {
            products: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    // Super Admin - All products
    static async findAll(options = {}) {
        const pool = getPool();
        const { 
            page = 1, limit = 10, search, category_id, 
            sort_by = 'created_at', sort_order = 'desc',
            min_price, max_price, created_by
        } = options;
        const offset = (page - 1) * limit;

        let query = `SELECT p.*, c.name as category_name, c.slug as category_slug, u.name as created_by_name
                     FROM products p
                     LEFT JOIN categories c ON p.category_id = c.id
                     LEFT JOIN users u ON p.created_by = u.id
                     WHERE 1=1`;
        
        let countQuery = `SELECT COUNT(*) as total FROM products p WHERE 1=1`;
        const params = [];
        const countParams = [];

        if (search) {
            query += ` AND (MATCH(p.name, p.description, p.meta_keywords) AGAINST(? IN NATURAL LANGUAGE MODE) 
                      OR p.name LIKE ?)`;
            countQuery += ` AND (MATCH(p.name, p.description, p.meta_keywords) AGAINST(? IN NATURAL LANGUAGE MODE) 
                          OR p.name LIKE ?)`;
            params.push(search, `%${search}%`);
            countParams.push(search, `%${search}%`);
        }

        if (category_id) {
            query += ' AND p.category_id = ?';
            countQuery += ' AND p.category_id = ?';
            params.push(category_id);
            countParams.push(category_id);
        }

        if (created_by) {
            query += ' AND p.created_by = ?';
            countQuery += ' AND p.created_by = ?';
            params.push(created_by);
            countParams.push(created_by);
        }

        if (min_price !== undefined) {
            query += ' AND p.price >= ?';
            countQuery += ' AND p.price >= ?';
            params.push(min_price);
            countParams.push(min_price);
        }

        if (max_price !== undefined) {
            query += ' AND p.price <= ?';
            countQuery += ' AND p.price <= ?';
            params.push(max_price);
            countParams.push(max_price);
        }

        const validSortFields = ['name', 'price', 'created_at'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';
        query += ` ORDER BY p.${sortField} ${sortDir} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        const [countResult] = await pool.query(countQuery, countParams);

        return {
            products: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async update(uuid, productData, userId, isSuperAdmin = false) {
        const pool = getPool();
        
        let checkQuery = 'SELECT id, created_by FROM products WHERE uuid = ?';
        const [existing] = await pool.query(checkQuery, [uuid]);
        
        if (existing.length === 0) return null;
        if (!isSuperAdmin && existing[0].created_by !== userId) return { unauthorized: true };

        const fields = [];
        const values = [];

        if (productData.name) {
            fields.push('name = ?');
            values.push(productData.name);
            const slug = await generateUniqueSlug(pool, 'products', productData.name, existing[0].id);
            fields.push('slug = ?');
            values.push(slug);
        }
        if (productData.description !== undefined) {
            fields.push('description = ?');
            values.push(productData.description);
        }
        if (productData.price !== undefined) {
            fields.push('price = ?');
            values.push(productData.price);
        }
        if (productData.stock !== undefined) {
            fields.push('stock = ?');
            values.push(productData.stock);
        }
        if (productData.category_id !== undefined) {
            fields.push('category_id = ?');
            values.push(productData.category_id);
        }
        if (productData.image_url !== undefined) {
            fields.push('image_url = ?');
            values.push(productData.image_url);
        }
        if (productData.image_original_name !== undefined) {
            fields.push('image_original_name = ?');
            values.push(productData.image_original_name);
        }
        if (productData.image_mime_type !== undefined) {
            fields.push('image_mime_type = ?');
            values.push(productData.image_mime_type);
        }
        if (productData.image_size !== undefined) {
            fields.push('image_size = ?');
            values.push(productData.image_size);
        }
        if (productData.meta_title !== undefined) {
            fields.push('meta_title = ?');
            values.push(productData.meta_title);
        }
        if (productData.meta_description !== undefined) {
            fields.push('meta_description = ?');
            values.push(productData.meta_description);
        }
        if (productData.meta_keywords !== undefined) {
            fields.push('meta_keywords = ?');
            values.push(productData.meta_keywords);
        }
        if (typeof productData.is_active === 'boolean') {
            fields.push('is_active = ?');
            values.push(productData.is_active);
        }

        if (fields.length === 0) return this.findByUuid(uuid);

        values.push(uuid);
        await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE uuid = ?`, values);
        
        return this.findByUuid(uuid);
    }

    static async delete(uuid, userId, isSuperAdmin = false) {
        const pool = getPool();
        
        let checkQuery = 'SELECT created_by FROM products WHERE uuid = ?';
        const [existing] = await pool.query(checkQuery, [uuid]);
        
        if (existing.length === 0) return { notFound: true };
        if (!isSuperAdmin && existing[0].created_by !== userId) return { unauthorized: true };

        const [result] = await pool.query('DELETE FROM products WHERE uuid = ?', [uuid]);
        return { success: result.affectedRows > 0 };
    }
}

module.exports = Product;
