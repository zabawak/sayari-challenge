const users = require('./users');
const questions = require('./questions');
const answers = require('./answers');
const comments = require('./comments');

// Map API Gateway events to specific handler functions
exports.handler = async (event) => {
  try {
    console.log('Event:', JSON.stringify(event));
    
    const { resource, httpMethod } = event;
    
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
      return await questions.getQuestions(event);
    }
    
    if (resource === '/questions' && httpMethod === 'POST') {
      return await questions.createQuestion(event);
    }
    
    // Answers endpoints - updated to use query parameters
    if (resource === '/answers' && httpMethod === 'GET') {
      return await answers.getAnswers(event);
    }
    
    if (resource === '/answers' && httpMethod === 'POST') {
      return await answers.createAnswer(event);
    }
    
    // Comments endpoints - updated to use query parameters
    if (resource === '/comments' && httpMethod === 'GET') {
      return await comments.getComments(event);
    }
    
    if (resource === '/comments' && httpMethod === 'POST') {
      return await comments.createComment(event);
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