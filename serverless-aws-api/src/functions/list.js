exports.listHandler = async (event) => {
    try {
        // Logic to retrieve the list of resources
        const resources = []; // Replace with actual data retrieval logic

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Resources retrieved successfully',
                data: resources,
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error retrieving resources',
                error: error.message,
            }),
        };
    }
};