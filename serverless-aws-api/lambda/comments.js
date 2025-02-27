const { query } = require('./db');

// GET /comments/{parent} - Get all comments for a parent (question or answer)
exports.getCommentsByParent = async (event) => {
  try {
    const parentId = parseInt(event.pathParameters.parent);
    
    if (isNaN(parentId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid parent ID' })
      };
    }
    
    // Determine if parent is question or answer
    const questionExists = await query('SELECT id FROM questions WHERE id = $1', [parentId]);
    const answerExists = await query('SELECT id FROM answers WHERE id = $1', [parentId]);
    
    let comments;
    if (questionExists.rows.length > 0) {
      comments = await query(
        'SELECT id, body, user_name, created_at FROM comments WHERE parent_question_id = $1 ORDER BY created_at ASC',
        [parentId]
      );
    } else if (answerExists.rows.length > 0) {
      comments = await query(
        'SELECT id, body, user_name, created_at FROM comments WHERE parent_answer_id = $1 ORDER BY created_at ASC',
        [parentId]
      );
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Parent not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comments.rows)
    };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// POST /comments/{parent} - Add a comment to a parent (question or answer)
exports.createComment = async (event) => {
  try {
    const parentId = parseInt(event.pathParameters.parent);
    const { body, user_name, parent_type } = JSON.parse(event.body);
    
    if (isNaN(parentId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid parent ID' })
      };
    }
    
    // Validate required fields
    if (!body || !user_name || !parent_type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: body, user_name, or parent_type' })
      };
    }
    
    // Validate parent type
    if (parent_type !== 'question' && parent_type !== 'answer') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'parent_type must be either "question" or "answer"' })
      };
    }
    
    // Check if parent exists
    let parentExists;
    if (parent_type === 'question') {
      parentExists = await query('SELECT id FROM questions WHERE id = $1', [parentId]);
    } else {
      parentExists = await query('SELECT id FROM answers WHERE id = $1', [parentId]);
    }
    
    if (parentExists.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: `${parent_type} not found` })
      };
    }
    
    // Check if user exists and get user_id
    const userResult = await query('SELECT id FROM users WHERE name = $1', [user_name]);
    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User not found' })
      };
    }
    
    const userId = userResult.rows[0].id;
    
    // Build parameters for the query
    const params = {
      body, 
      user_id: userId, 
      user_name
    };
    
    let result;
    if (parent_type === 'question') {
      result = await query(
        'INSERT INTO comments (body, user_id, user_name, parent_question_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [body, userId, user_name, parentId]
      );
    } else {
      result = await query(
        'INSERT INTO comments (body, user_id, user_name, parent_answer_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [body, userId, user_name, parentId]
      );
    }
    
    return {
      statusCode: 201,
      body: JSON.stringify(result.rows[0])
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// GET /comments/{user} - Get all comments by username
exports.getCommentsByUser = async (event) => {
  try {
    const user_name = event.pathParameters.user;
    
    const result = await query(`
      SELECT 
        c.id, 
        c.body, 
        c.user_name, 
        c.created_at,
        c.parent_question_id,
        c.parent_answer_id,
        CASE 
          WHEN c.parent_question_id IS NOT NULL THEN 'question'
          WHEN c.parent_answer_id IS NOT NULL THEN 'answer'
        END as parent_type,
        CASE 
          WHEN c.parent_question_id IS NOT NULL THEN 
            (SELECT title FROM questions WHERE id = c.parent_question_id)
          WHEN c.parent_answer_id IS NOT NULL THEN 
            (SELECT title FROM questions 
             WHERE id = (SELECT parent_question_id FROM answers WHERE id = c.parent_answer_id))
        END as parent_title
      FROM comments c
      WHERE c.user_name = $1
      ORDER BY c.created_at DESC
    `, [user_name]);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.rows)
    };
  } catch (error) {
    console.error('Error fetching comments by user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};