exports.createHandler = async (event) => {
    const requestBody = JSON.parse(event.body);
    
    // Logic to create a resource goes here
    // For example, saving to a database

    return {
        statusCode: 201,
        body: JSON.stringify({
            message: 'Resource created successfully',
            data: requestBody // Return the created resource data
        }),
    };
};