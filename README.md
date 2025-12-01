# Shop Hub Backend

Node.js + Express.js + My sql

env setup
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (XAMPP MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=product_management_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production_2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production_2024
JWT_REFRESH_EXPIRES_IN=7d

# Upload Configuration
UPLOAD_PATH=uploads/products
MAX_FILE_SIZE=5242880

# setup
npm i - install command 

# Start command
npm run dev - development mode

# Super admin creds
id: superadmin@example.com
password: password123

# Admin creds
id: admin@example.com
password: password123

# Customer creds
id: customer@example.com
password: password123