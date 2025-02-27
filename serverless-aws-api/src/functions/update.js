exports.updateHandler = async (event) => {
    const { id, data } = JSON.parse(event.body);

    // Logic to update the resource in the database or data source
    // This is a placeholder for the actual update logic
    const updatedResource = {
        id,
        ...data,
    };

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Resource updated successfully',
            resource: updatedResource,
        }),
    };
};