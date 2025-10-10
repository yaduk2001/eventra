const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eventrra',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL Database connection failed:', error.message);
    return false;
  }
};

// Database helper functions
const dbHelpers = {
  // Execute query with parameters
  async query(sql, params = []) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // Execute query and return single row
  async queryOne(sql, params = []) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows[0] || null;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // Execute insert and return insert ID
  async insert(sql, params = []) {
    try {
      const [result] = await pool.execute(sql, params);
      return result.insertId;
    } catch (error) {
      console.error('Database insert error:', error);
      throw error;
    }
  },

  // Execute update and return affected rows
  async update(sql, params = []) {
    try {
      const [result] = await pool.execute(sql, params);
      return result.affectedRows;
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  },

  // Execute delete and return affected rows
  async delete(sql, params = []) {
    try {
      const [result] = await pool.execute(sql, params);
      return result.affectedRows;
    } catch (error) {
      console.error('Database delete error:', error);
      throw error;
    }
  },

  // Get connection from pool
  async getConnection() {
    return await pool.getConnection();
  },

  // Close all connections
  async close() {
    await pool.end();
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Check if tables exist, if not create them
    const tables = await dbHelpers.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME || 'eventrra']);

    if (tables.length === 0) {
      console.log('📊 Initializing database tables...');
      // Tables will be created by running the schema.sql file
      console.log('⚠️  Please run the schema.sql file to create tables');
    } else {
      console.log(`✅ Database initialized with ${tables.length} tables`);
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

module.exports = {
  pool,
  dbHelpers,
  testConnection,
  initializeDatabase
};
