exports.deleteHandler = async (event) => {
    const { id } = event.pathParameters;

    // Logic to delete the resource with the given id
    // This could involve calling a database or another service

    // Example response
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: `Resource with id ${id} deleted successfully.`,
        }),
    };
};