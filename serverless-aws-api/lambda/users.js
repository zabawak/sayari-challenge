const { query } = require('./db');

// GET /users - Return all registered users
exports.getAllUsers = async (event) => {
  try {
    const result = await query('SELECT name FROM users');
    const users = result.rows.map(row => row.name);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// POST /users/{name} - Create new user
exports.createUser = async (event) => {
  try {
    const name = event.pathParameters.name;
    
    // Check if user already exists
    const existingUser = await query('SELECT name FROM users WHERE name = $1', [name]);
    if (existingUser.rows.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'User already exists' })
      };
    }
    
    // Insert new user
    const result = await query('INSERT INTO users (name) VALUES ($1) RETURNING id, name', [name]);
    
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'User created successfully',
        user: result.rows[0]
      })
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// GET /users/{name} - Get user by name
exports.getUserByName = async (event) => {
  try {
    const name = event.pathParameters.name;
    
    const result = await query('SELECT id, name FROM users WHERE name = $1', [name]);
    
    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.rows[0])
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};