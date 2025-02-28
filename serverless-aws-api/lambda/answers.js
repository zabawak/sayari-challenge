const { query } = require('./db');

// Updated to handle query parameters
exports.getAnswers = async (event) => {
  try {
    // Check for query parameters
    const queryParams = event.queryStringParameters || {};
    const answerId = queryParams.id ? parseInt(queryParams.id) : null;
    const username = queryParams.user || null;
    const questionId = queryParams.question ? parseInt(queryParams.question) : null;
    
    let sql;
    let params = [];
    let paramIndex = 1;
    let whereClause = [];
    
    // Base query
    sql = `
      SELECT a.id, a.body, a.created_at, a.score, a.user_id, a.user_name, a.parent_question_id, a.accepted,
      q.title as question_title
      FROM answers a
      JOIN questions q ON a.parent_question_id = q.id
    `;
    
    // Add filters based on provided query parameters
    if (answerId && !isNaN(answerId)) {
      whereClause.push(`a.id = $${paramIndex}`);
      params.push(answerId);
      paramIndex++;
    }
    
    if (username) {
      whereClause.push(`a.user_name = $${paramIndex}`);
      params.push(username);
      paramIndex++;
    }
    
    if (questionId && !isNaN(questionId)) {
      whereClause.push(`a.parent_question_id = $${paramIndex}`);
      params.push(questionId);
      paramIndex++;
    }
    
    // Add WHERE clause if any filters exist
    if (whereClause.length > 0) {
      sql += ` WHERE ${whereClause.join(' AND ')}`;
    }
    
    sql += ` ORDER BY a.created_at DESC`;
    
    const result = await query(sql, params);
    
    // If filtering by answerId, get comments for that specific answer
    if (answerId && !isNaN(answerId) && result.rows.length > 0) {
      const commentsResult = await query(
        'SELECT id, body, user_name, created_at FROM comments WHERE parent_answer_id = $1 ORDER BY created_at ASC',
        [answerId]
      );
      
      result.rows[0].comments = commentsResult.rows;
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.rows)
    };
  } catch (error) {
    console.error('Error fetching answers:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// POST /answers/{question} - Add a new answer to a question
exports.createAnswer = async (event) => {
  try {
    const { body, user_name, question_id } = JSON.parse(event.body);
    
    // Validate required fields
    if (!body || !user_name || !question_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: body, user_name, or question_id' })
      };
    }
    
    // Check if question exists
    const questionExists = await query('SELECT id FROM questions WHERE id = $1', [question_id]);
    if (questionExists.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Question not found' })
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
    
    const result = await query(
      'INSERT INTO answers (body, user_id, user_name, parent_question_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [body, userId, user_name, question_id]
    );
    
    return {
      statusCode: 201,
      body: JSON.stringify(result.rows[0])
    };
  } catch (error) {
    console.error('Error creating answer:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};