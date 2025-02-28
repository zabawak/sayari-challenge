# sayari-challenge

Overall development process:

1. Assessed provided sample dataset. Made note of required fields for each relevant data types. Primary tables will be for (users, questions, answers, comments)

2. Spun up postgres in docker-compose to test modeling out tables for dataset. Wound up with model located [here](serverless-aws-api/init.sql) 

Key considerations were cascading deletes. If a user gets deleted, we want to delete all of their questions/comments/answers. 
Same applies to a question/answer - if that is deleted then we want to delete all the child comments and/or answers. 
Comments can be made on both questions & answers, so I added a strict constraint that a comment is only a child of one of these types. 

3. Thought through a logical OpenAPI spec for this type of website and created the model [here](serverless-aws-api/stack-overfaux-oas.yml) 

    Users
    GET  /users
    GET  /users/{name} - lookup a user by username to fetch id
    POST /users/{name} - create a new user with {name}

    Questions
    GET  /questions
    POST /questions         - post a new question
    GET  /questions?id     - lookup question by id 
    GET  /questions?user   - get all questions that a user has made

    Answers 
    GET  /answers?user     - get all answers that a user has made
    GET  /answers?question - get all answers for a specific question
    POST /answers/{question} - post an answer to a question

    Comments
    GET  /comments?parent  - get all comments that are a child to a parentId (can be a question or answer)
    GET  /comments?user    - gets all comments made by a user
    POST /comments/{parent}  - post a comment to a question or answer

    Question/Answer/Comment POST endpoints need requestBody with schema to follow postgres table schema. 

4. Utilized a serverless application model to plan out a cloud-native solution/deployment using the serverless framework. Initially started with just the resources required for an RDS instance and an APIGatewayRestApi (+ VPC, Subnets, etc). Proofed out an infrastructure deployment using [localstack](https://www.localstack.cloud/). Discovered localstack does not support RDS very well :/
Docker-compose configuration located [here](serverless-aws-api/docker-compose.yml). 

5. Fed my OAS model into claude-3.7 to generate a baseline serverless framework configuration. 
Config [here](serverless-aws-api/serverless.yml)

6. Iterated on the API configuration a handful of times, settling on queryParams for relevant fields rather than pathParams with extended resource names (e.g. GET /answer/by-id/{id})

7. Created a common query helper for use across lambda handlers to access postgres db

8. Had Claude generate a basic lambda handler for each resource to address the queries required of our API spec above, along with a common handler to handle the actual API resource routing. 

9. Spot checked queries/code/etc 

10. Added DELETE actions to resources

    Users
    DELETE /users/{name} - deletes user and all created questions (and cascading children)

    Questions
    DELETE /questions/{id} - deletes question and all child comments and answers (and cascading comments)

    Answers
    DELETE /answers/{id} - deletes answer and any child comments on answer

    Comments
    DELETE /comments/{id} - deletes single comment





TODO:
- Actual testing!
- Function to seed database with sample data
- I would probably switch the organizational structure in the future - have each http event route to the relevant handler (answers/comments/etc) rather than a central lambda router
- A real cloud deployment & testing in-environment. 
- Production deployment would certainly need a larger RDS instance depending on application scale.
- Enhanced logging - add more debug logs on events. 
- Dockerize the thing & deployment to ECS/EKS
