const { query } = require('./db');

// Updated to handle query parameters
exports.getComments = async (event) => {
  try {
    // Check for query parameters
    const queryParams = event.queryStringParameters || {};
    const commentId = queryParams.id ? parseInt(queryParams.id) : null;
    const username = queryParams.user || null;
    const parentId = queryParams.parent ? parseInt(queryParams.parent) : null;
    
    let sql;
    let params = [];
    let paramIndex = 1;
    let whereClause = [];
    
    // Base query
    sql = `
      SELECT c.id, c.body, c.user_id, c.user_name, c.parent_question_id, c.parent_answer_id, c.created_at,
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
    `;
    
    // Add filters based on provided query parameters
    if (commentId && !isNaN(commentId)) {
      whereClause.push(`c.id = $${paramIndex}`);
      params.push(commentId);
      paramIndex++;
    }
    
    if (username) {
      whereClause.push(`c.user_name = $${paramIndex}`);
      params.push(username);
      paramIndex++;
    }
    
    if (parentId && !isNaN(parentId)) {
      whereClause.push(`(c.parent_question_id = $${paramIndex} OR c.parent_answer_id = $${paramIndex})`);
      params.push(parentId);
      paramIndex++;
    }
    
    // Add WHERE clause if any filters exist
    if (whereClause.length > 0) {
      sql += ` WHERE ${whereClause.join(' AND ')}`;
    }
    
    sql += ` ORDER BY c.created_at DESC`;
    
    const result = await query(sql, params);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.rows)
    };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// Create comment - updated to use request body with parent_id and parent_type
exports.createComment = async (event) => {
  try {
    const { body, user_name, parent_id, parent_type } = JSON.parse(event.body);
    
    // Validate required fields
    if (!body || !user_name || !parent_id || !parent_type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: body, user_name, parent_id, or parent_type' })
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
      parentExists = await query('SELECT id FROM questions WHERE id = $1', [parent_id]);
    } else {
      parentExists = await query('SELECT id FROM answers WHERE id = $1', [parent_id]);
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
    
    let result;
    if (parent_type === 'question') {
      result = await query(
        'INSERT INTO comments (body, user_id, user_name, parent_question_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [body, userId, user_name, parent_id]
      );
    } else {
      result = await query(
        'INSERT INTO comments (body, user_id, user_name, parent_answer_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [body, userId, user_name, parent_id]
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

// DELETE /comments/{id} - Delete a comment by ID
exports.deleteComment = async (event) => {
  try {
    const commentId = parseInt(event.pathParameters.id);
    
    if (isNaN(commentId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Comment ID must be a number' })
      };
    }
    
    // Check if comment exists
    const commentExists = await query('SELECT id FROM comments WHERE id = $1', [commentId]);
    if (commentExists.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Comment not found' })
      };
    }
    
    // Delete the comment
    await query('DELETE FROM comments WHERE id = $1', [commentId]);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Comment deleted successfully' })
    };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};