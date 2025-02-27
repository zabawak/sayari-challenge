const users = require('./users');
const questions = require('./questions');
const answers = require('./answers');
const comments = require('./comments');

// Map API Gateway events to specific handler functions
exports.handler = async (event) => {
  try {
    console.log('Event:', JSON.stringify(event));
    
    const { resource, httpMethod, pathParameters } = event;
    
    // Users endpoints
    if (resource === '/users' && httpMethod === 'GET') {
      return await users.getAllUsers(event);
    }
    
    if (resource === '/users/{name}' && httpMethod === 'POST') {
      return await users.createUser(event);
    }
    
    if (resource === '/users/{name}' && httpMethod === 'GET') {
      return await users.getUserByName(event);
    }
    
    // Questions endpoints
    if (resource === '/questions' && httpMethod === 'GET') {
      return await questions.getAllQuestions(event);
    }
    
    if (resource === '/questions' && httpMethod === 'POST') {
      return await questions.createQuestion(event);
    }
    
    if (resource === '/questions/{id}' && httpMethod === 'GET') {
      return await questions.getQuestionById(event);
    }
    
    if (resource === '/questions/{user}' && httpMethod === 'GET' && 
        isNaN(parseInt(event.pathParameters.user))) {
      return await questions.getQuestionsByUser(event);
    }
    
    // Answers endpoints
    if (resource === '/answers/{user}' && httpMethod === 'GET' && 
        isNaN(parseInt(event.pathParameters.user))) {
      return await answers.getAnswersByUser(event);
    }
    
    if (resource === '/answers/{question}' && httpMethod === 'GET' && 
        !isNaN(parseInt(event.pathParameters.question))) {
      return await answers.getAnswersByQuestion(event);
    }
    
    if (resource === '/answers/{question}' && httpMethod === 'POST') {
      return await answers.createAnswer(event);
    }
    
    // Comments endpoints
    if (resource === '/comments/{parent}' && httpMethod === 'GET' && 
        !isNaN(parseInt(event.pathParameters.parent))) {
      return await comments.getCommentsByParent(event);
    }
    
    if (resource === '/comments/{parent}' && httpMethod === 'POST') {
      return await comments.createComment(event);
    }
    
    if (resource === '/comments/{user}' && httpMethod === 'GET' && 
        isNaN(parseInt(event.pathParameters.user))) {
      return await comments.getCommentsByUser(event);
    }
    
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Route not found' })
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};