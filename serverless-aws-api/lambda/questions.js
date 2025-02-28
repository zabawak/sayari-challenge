const { query } = require('./db');

// Updated to handle query parameters for id and user filtering
exports.getQuestions = async (event) => {
  try {
    // Check for query parameters
    const queryParams = event.queryStringParameters || {};
    const questionId = queryParams.id ? parseInt(queryParams.id) : null;
    const username = queryParams.user || null;
    
    let result;
    
    // Case 1: Filter by ID
    if (questionId && !isNaN(questionId)) {
      // Get question details
      const questionResult = await query(`
        SELECT q.id, q.title, q.body, q.created_at, q.score, q.user_id, q.user_name
        FROM questions q 
        WHERE q.id = $1
      `, [questionId]);
      
      if (questionResult.rows.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Question not found' })
        };
      }
      
      // Get answer count
      const answerCountResult = await query(
        'SELECT COUNT(*) as answer_count FROM answers WHERE parent_question_id = $1',
        [questionId]
      );
      
      // Get comments for this question
      const commentsResult = await query(
        'SELECT id, body, user_name, created_at FROM comments WHERE parent_question_id = $1 ORDER BY created_at ASC',
        [questionId]
      );
      
      // Combine results
      const question = {
        ...questionResult.rows[0],
        answer_count: parseInt(answerCountResult.rows[0].answer_count),
        comments: commentsResult.rows
      };
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question)
      };
    }
    
    // Case 2: Filter by username
    else if (username) {
      result = await query(`
        SELECT q.id, q.title, q.body, q.created_at, q.score, q.user_id, q.user_name,
        COUNT(DISTINCT a.id) as answer_count 
        FROM questions q 
        LEFT JOIN answers a ON q.id = a.parent_question_id
        WHERE q.user_name = $1
        GROUP BY q.id
        ORDER BY q.created_at DESC
      `, [username]);
    }
    
    // Case 3: Get all questions (no filters)
    else {
      result = await query(`
        SELECT q.id, q.title, q.body, q.created_at, q.score, q.user_id, q.user_name,
        COUNT(DISTINCT a.id) as answer_count 
        FROM questions q 
        LEFT JOIN answers a ON q.id = a.parent_question_id 
        GROUP BY q.id
        ORDER BY q.created_at DESC
      `);
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.rows)
    };
  } catch (error) {
    console.error('Error fetching questions:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// POST /questions - Create new question
exports.createQuestion = async (event) => {
  try {
    const { title, body, user_name } = JSON.parse(event.body);
    
    // Validate required fields
    if (!title || !body || !user_name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: title, body, or user_name' })
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
    
    const user_id = userResult.rows[0].id;
    
    const result = await query(
      'INSERT INTO questions (title, body, user_id, user_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, body, user_id, user_name]
    );
    
    return {
      statusCode: 201,
      body: JSON.stringify(result.rows[0])
    };
  } catch (error) {
    console.error('Error creating question:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// GET /questions/{id} - Get question by ID
exports.getQuestionById = async (event) => {
  try {
    const questionId = parseInt(event.pathParameters.id);
    
    if (isNaN(questionId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid question ID' })
      };
    }
    
    // Get question details
    const questionResult = await query(`
      SELECT q.id, q.title, q.body, q.created_at, q.score, q.user_id, q.user_name
      FROM questions q 
      WHERE q.id = $1
    `, [questionId]);
    
    if (questionResult.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Question not found' })
      };
    }
    
    // Get answer count
    const answerCountResult = await query(
      'SELECT COUNT(*) as answer_count FROM answers WHERE parent_question_id = $1',
      [questionId]
    );
    
    // Get comments for this question
    const commentsResult = await query(
      'SELECT id, body, user_name, created_at FROM comments WHERE parent_question_id = $1 ORDER BY created_at ASC',
      [questionId]
    );
    
    // Combine results
    const question = {
      ...questionResult.rows[0],
      answer_count: parseInt(answerCountResult.rows[0].answer_count),
      comments: commentsResult.rows
    };
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question)
    };
  } catch (error) {
    console.error('Error fetching question:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// GET /questions/{user} - Get questions by username
exports.getQuestionsByUser = async (event) => {
  try {
    const user_name = event.pathParameters.user;
    
    const result = await query(`
      SELECT q.id, q.title, q.body, q.created_at, q.score, q.user_id,
      COUNT(DISTINCT a.id) as answer_count 
      FROM questions q 
      LEFT JOIN answers a ON q.id = a.parent_question_id
      WHERE q.user_name = $1
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `, [user_name]);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.rows)
    };
  } catch (error) {
    console.error('Error fetching questions by user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// DELETE /questions/{id} - Delete a question by ID
exports.deleteQuestion = async (event) => {
  try {
    const questionId = parseInt(event.pathParameters.id);
    
    if (isNaN(questionId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Question ID must be a number' })
      };
    }
    
    // Check if question exists
    const questionExists = await query('SELECT id FROM questions WHERE id = $1', [questionId]);
    if (questionExists.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Question not found' })
      };
    }
    
    // Begin transaction to delete question and related data
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete comments on answers to this question
      await client.query(
        'DELETE FROM comments WHERE parent_answer_id IN (SELECT id FROM answers WHERE parent_question_id = $1)',
        [questionId]
      );
      
      // Delete comments directly on this question
      await client.query('DELETE FROM comments WHERE parent_question_id = $1', [questionId]);
      
      // Delete answers to this question
      await client.query('DELETE FROM answers WHERE parent_question_id = $1', [questionId]);
      
      // Delete the question
      await client.query('DELETE FROM questions WHERE id = $1', [questionId]);
      
      await client.query('COMMIT');
      
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Question and all associated content deleted successfully' })
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting question:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};