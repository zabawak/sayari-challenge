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

// DELETE /users/{name} - Delete a user by name
exports.deleteUser = async (event) => {
  try {
    const { name } = event.pathParameters;
    
    if (!name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Username is required' })
      };
    }
    
    // Check if user exists
    const userExists = await query('SELECT id FROM users WHERE name = $1', [name]);
    if (userExists.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User not found' })
      };
    }
    
    const userId = userExists.rows[0].id;
    
    // Begin transaction to delete user and related data
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete comments on answers by this user
      await client.query(
        'DELETE FROM comments WHERE parent_answer_id IN (SELECT id FROM answers WHERE user_id = $1)',
        [userId]
      );
      
      // Delete comments directly by this user
      await client.query('DELETE FROM comments WHERE user_id = $1', [userId]);
      
      // Delete answers by this user
      await client.query('DELETE FROM answers WHERE user_id = $1', [userId]);
      
      // Delete questions by this user
      await client.query('DELETE FROM questions WHERE user_id = $1', [userId]);
      
      // Finally delete the user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      
      await client.query('COMMIT');
      
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'User and all associated content deleted successfully' })
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};