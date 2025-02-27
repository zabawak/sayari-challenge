export const ResourceModel = {
    // Define the schema for the resource
    id: null,
    name: '',
    description: '',
    
    // Method to create a new resource
    create(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        // Logic to save the resource to a database can be added here
    },

    // Method to update an existing resource
    update(data) {
        if (data.name) this.name = data.name;
        if (data.description) this.description = data.description;
        // Logic to update the resource in a database can be added here
    },

    // Method to delete the resource
    delete() {
        // Logic to delete the resource from a database can be added here
    },

    // Method to retrieve the resource
    get() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
        };
    }
};