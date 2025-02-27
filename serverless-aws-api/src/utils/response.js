module.exports = {
  success: (statusCode, data) => {
    return {
      statusCode: statusCode || 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  },
  
  error: (statusCode, message) => {
    return {
      statusCode: statusCode || 500,
      body: JSON.stringify({ error: message }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  },
};