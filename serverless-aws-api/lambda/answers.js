const { query } = require('./db');

// GET /answers/{user} - Get all answers by username
exports.getAnswersByUser = async (event) => {
  try {
    const user_name = event.pathParameters.user;
    
    const result = await query(`
      SELECT a.id, a.body, a.created_at, a.score, a.user_id, a.user_name, a.parent_question_id, a.accepted,
      q.title as question_title
      FROM answers a
      JOIN questions q ON a.parent_question_id = q.id
      WHERE a.user_name = $1
      ORDER BY a.created_at DESC
    `, [user_name]);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.rows)
    };
  } catch (error) {
    console.error('Error fetching answers by user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// GET /answers/{question} - Get all answers to a question
exports.getAnswersByQuestion = async (event) => {
  try {
    const questionId = parseInt(event.pathParameters.question);
    
    if (isNaN(questionId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid question ID' })
      };
    }
    
    // First check if question exists
    const questionExists = await query('SELECT id FROM questions WHERE id = $1', [questionId]);
    if (questionExists.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Question not found' })
      };
    }
    
    // Get answers
    const answersResult = await query(`
      SELECT a.id, a.body, a.created_at, a.score, a.user_id, a.user_name, a.accepted
      FROM answers a
      WHERE a.parent_question_id = $1
      ORDER BY a.accepted DESC, a.score DESC, a.created_at ASC
    `, [questionId]);
    
    // Get comments for each answer
    const answers = await Promise.all(answersResult.rows.map(async (answer) => {
      const commentsResult = await query(
        'SELECT id, body, user_name, created_at FROM comments WHERE parent_answer_id = $1 ORDER BY created_at ASC',
        [answer.id]
      );
      
      return {
        ...answer,
        comments: commentsResult.rows
      };
    }));
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers)
    };
  } catch (error) {
    console.error('Error fetching answers for question:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// POST /answers/{question} - Add a new answer to a question
exports.createAnswer = async (event) => {
  try {
    const questionId = parseInt(event.pathParameters.question);
    const { body, user_name } = JSON.parse(event.body);
    
    if (isNaN(questionId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid question ID' })
      };
    }
    
    // Validate required fields
    if (!body || !user_name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: body or user_name' })
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
      [body, userId, user_name, questionId]
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