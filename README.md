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
    GET  /question/{id}     - lookup question by id 
    GET  /question/{user}   - get all questions that a user has made

    Answers 
    GET  /answers/{user}     - get all answers that a user has made
    GET  /answers/{question} - get all answers for a specific question
    POST /answers/{question} - post an answer to a question

    Comments
    GET  /comments/{parent}  - get all comments that are a child to a parentId (can be a question or answer)
    POST /comments/{parent}  - post a comment to a question or answer
    GET  /comments/{user}    - gets all comments made by a user

    Question/Answer/Comment POST endpoints need requestBody with schema to follow postgres table schema. 

4. Utilized a serverless application model to plan out a cloud-native solution/deployment using the serverless framework. Initially started with just the resources required for an RDS instance and an APIGatewayRestApi (+ VPC, Subnets, etc). Proofed out an infrastructure deployment using [localstack](https://www.localstack.cloud/). Docker-compose configuration located [here](serverless-aws-api/docker-compose.yml). 

5. Fed my OAS model into claude-3.7 to generate a baseline serverless framework configuration. 
Config [here](serverless-aws-api/serverless.yml)




