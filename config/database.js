const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const dbConfigWithDB = {
    ...dbConfig,
    database: process.env.DB_NAME
};

let pool = null;

const createDatabase = async () => {
    const connection = await mysql.createConnection(dbConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await connection.end();
};

const createTables = async () => {
    const connection = await pool.getConnection();
    
    // Users Table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            uuid VARCHAR(36) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('super_admin', 'admin', 'customer') DEFAULT 'customer',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_role (role),
            INDEX idx_uuid (uuid)
        )
    `);

    // Categories Table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS categories (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_slug (slug),
            INDEX idx_active (is_active)
        )
    `);

    // Products Table with Indexing
    await connection.query(`
        CREATE TABLE IF NOT EXISTS products (
            id INT PRIMARY KEY AUTO_INCREMENT,
            uuid VARCHAR(36) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            stock INT DEFAULT 0,
            category_id INT,
            created_by INT NOT NULL,
            image_url VARCHAR(500),
            image_original_name VARCHAR(255),
            image_mime_type VARCHAR(100),
            image_size INT,
            meta_title VARCHAR(255),
            meta_description TEXT,
            meta_keywords VARCHAR(500),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_uuid (uuid),
            INDEX idx_name (name),
            INDEX idx_slug (slug),
            INDEX idx_price (price),
            INDEX idx_category (category_id),
            INDEX idx_created_by (created_by),
            INDEX idx_active (is_active),
            INDEX idx_search (name, description(100)),
            FULLTEXT INDEX ft_search (name, description, meta_keywords)
        )
    `);

    // Refresh Tokens Table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            token VARCHAR(500) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_token (token(255)),
            INDEX idx_user (user_id),
            INDEX idx_expires (expires_at)
        )
    `);

    connection.release();
};

const insertDefaultData = async () => {
    const connection = await pool.getConnection();
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    // Check if users exist
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count === 0) {
        const hashedPassword = await bcrypt.hash('password123', 12);
        
        await connection.query(`
            INSERT INTO users (uuid, name, email, password, role) VALUES
            (?, 'Super Admin', 'superadmin@example.com', ?, 'super_admin'),
            (?, 'Admin User', 'admin@example.com', ?, 'admin'),
            (?, 'Customer User', 'customer@example.com', ?, 'customer')
        `, [uuidv4(), hashedPassword, uuidv4(), hashedPassword, uuidv4(), hashedPassword]);
    }

    // Check if categories exist
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
    
    if (categories[0].count === 0) {
        await connection.query(`
            INSERT INTO categories (name, slug, description) VALUES
            ('Electronics', 'electronics', 'Electronic devices and gadgets'),
            ('Clothing', 'clothing', 'Fashion and apparel'),
            ('Books', 'books', 'Books and publications'),
            ('Home & Garden', 'home-garden', 'Home decor and garden items'),
            ('Sports', 'sports', 'Sports equipment and accessories')
        `);
    }

    // Check if products exist
    const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
    
    if (products[0].count === 0) {
        const [adminUser] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
        const [superAdmin] = await connection.query('SELECT id FROM users WHERE role = "super_admin" LIMIT 1');
        
        if (adminUser.length > 0 && superAdmin.length > 0) {
            await connection.query(`
                INSERT INTO products (uuid, image_url, name, slug, description, price, stock, category_id, created_by, meta_title, meta_description, meta_keywords) VALUES
                (?, '/uploads/products/6d32f629-ed15-4daa-baec-6df8b12c0d88.jpg', 'Wireless Headphones', 'wireless-headphones', 'High-quality wireless headphones with noise cancellation', 149.99, 50, 1, ?, 'Wireless Headphones - Premium Sound', 'Buy premium wireless headphones with noise cancellation', 'headphones, wireless, audio, music'),
                (?, '/uploads/products/3f325330-d449-4123-b652-a354ec411712.jpg', 'Smart Watch', 'smart-watch', 'Feature-rich smartwatch with health monitoring', 299.99, 30, 1, ?, 'Smart Watch - Health Monitoring', 'Advanced smartwatch with fitness tracking', 'smartwatch, fitness, health, wearable'),
                (?, '/uploads/products/c5dc2714-4ed2-4742-866a-ae2aa1f043b6.jpg',  'Running Shoes', 'running-shoes', 'Comfortable running shoes for athletes', 89.99, 100, 5, ?, 'Running Shoes - Athletic Footwear', 'Premium running shoes for professional athletes', 'shoes, running, sports, athletic'),
                (?, '/uploads/products/400de619-635f-4b44-8503-dcdd58b81f07.webp', 'Programming Book', 'programming-book', 'Complete guide to modern programming', 49.99, 200, 3, ?, 'Programming Book - Learn Coding', 'Comprehensive programming guide for beginners', 'book, programming, coding, learning'),
                (?, '/uploads/products/5369b8e6-5e49-44da-8801-fadeed049c11.jpg', 'Cotton T-Shirt', 'cotton-tshirt', 'Premium cotton t-shirt in multiple colors', 29.99, 150, 2, ?, 'Cotton T-Shirt - Premium Quality', 'Comfortable cotton t-shirts for everyday wear', 'tshirt, cotton, clothing, fashion'),
                (?, '/uploads/products/f7cf0ca1-9453-43b6-9ae0-b4eacfcd85ae.webp', 'Garden Tools Set', 'garden-tools-set', 'Complete set of gardening tools', 79.99, 40, 4, ?, 'Garden Tools Set - Complete Kit', 'Professional garden tools for home gardening', 'garden, tools, home, outdoor')
                `, [
                uuidv4(), adminUser[0].id,
                uuidv4(), adminUser[0].id,
                uuidv4(), adminUser[0].id,
                uuidv4(), superAdmin[0].id,
                uuidv4(), superAdmin[0].id,
                uuidv4(), superAdmin[0].id
            ]);
        }
    }

    connection.release();
};

const initializeDatabase = async () => {
    try {
        await createDatabase();
        pool = mysql.createPool(dbConfigWithDB);
        await createTables();
        await insertDefaultData();
        console.log('Database initialized successfully');
        return pool;
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
};

const getPool = () => pool;

module.exports = { initializeDatabase, getPool };
