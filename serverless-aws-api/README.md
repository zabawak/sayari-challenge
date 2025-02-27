# Serverless AWS API

This project is a REST API built using the Serverless Framework and deployed on AWS Lambda. It provides a set of functions to create, read, update, and delete resources.

## Project Structure

```
serverless-aws-api
├── src
│   ├── functions
│   │   ├── create.js       # Handles creation of resources
│   │   ├── delete.js       # Handles deletion of resources
│   │   ├── get.js          # Retrieves a specific resource
│   │   ├── list.js         # Retrieves a list of resources
│   │   └── update.js       # Handles updating of resources
│   ├── models
│   │   └── index.js        # Defines models or schemas for resources
│   └── utils
│       └── response.js     # Utility functions for formatting responses
├── serverless.yml          # Configuration for Serverless Framework
├── package.json             # npm configuration and dependencies
├── .gitignore               # Files and directories to ignore by Git
├── .env                     # Environment variables for the project
└── README.md                # Project documentation
```

## Setup Instructions

1. **Install Dependencies**: Run `npm install` to install the necessary dependencies listed in `package.json`.

2. **Configure Environment Variables**: Create a `.env` file in the root directory and add your environment variables, such as API keys and database connection strings.

3. **Deploy the API**: Use the Serverless Framework to deploy the API to AWS by running `serverless deploy`.

4. **Invoke Functions**: You can test the functions locally or invoke them using the Serverless CLI.

## Usage

- **Create Resource**: Send a POST request to the `/create` endpoint.
- **Get Resource**: Send a GET request to the `/get/{id}` endpoint.
- **List Resources**: Send a GET request to the `/list` endpoint.
- **Update Resource**: Send a PUT request to the `/update/{id}` endpoint.
- **Delete Resource**: Send a DELETE request to the `/delete/{id}` endpoint.

## Contributing

Feel free to submit issues or pull requests to improve the project. 

## License

This project is licensed under the MIT License.