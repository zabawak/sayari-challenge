-- SQL script to initialize the PostgreSQL database

-- Create a table for users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Create a table for questions
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INT DEFAULT 0,
    user_id INT NOT NULL,
    user_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_name) REFERENCES users(name) ON DELETE CASCADE
);

CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INT DEFAULT 0,
    user_id INT NOT NULL,
    user_name VARCHAR(50) NOT NULL,
    accepted BOOLEAN DEFAULT FALSE,
    parent_question_id INT NOT NULL,
    FOREIGN KEY (parent_question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_name) REFERENCES users(name) ON DELETE CASCADE
);

-- Create a table for comments
-- assumes user must be created before able to comment/question/etc
-- assume if user is deleted, then all comments/answers are deleted with it
-- assume if question is deleted, then all answers/comments are deleted with it
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    parent_question_id INT,
    parent_answer_id INT,
    user_id INT NOT NULL,
    user_name VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_answer_id) REFERENCES answers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_name) REFERENCES users(name) ON DELETE CASCADE,
    -- Ensure comment belongs to either a question OR an answer, but not both
    CONSTRAINT parent_check CHECK (
        (parent_question_id IS NULL AND parent_answer_id IS NOT NULL) OR
        (parent_question_id IS NOT NULL AND parent_answer_id IS NULL)
    )
);



-- join table for question_comments
-- CREATE TABLE question_comments (
--     question_id INT NOT NULL,
--     comment_id INT NOT NULL,
--     FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
--     FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
-- )

-- CREATE TABLE question_answers (
--     question_id INT NOT NULL,
--     answer_id INT NOT NULL,
--     FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
--     FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE
-- )

-- -- Create a table for answers


-- -- join table for answer_comments
-- CREATE TABLE answer_comments (
--     answer_id INT NOT NULL,
--     comment_id INT NOT NULL,
--     FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE,
--     FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
-- )


-- Insert initial data into users
INSERT INTO users (name) VALUES('daemacles');

-- Insert initial data into questions
INSERT INTO questions (title, body, user_id, user_name) VALUES
('test question', 'this is a test question', 1, 'daemacles');



-- INSERT INTO questions (user_id, title, body) VALUES
-- (1, 'What is PostgreSQL?', 'I would like to know more about PostgreSQL.'),
-- (2, 'How to use Docker with PostgreSQL?', 'Can someone provide a guide on using Docker with PostgreSQL?');

-- -- Insert initial data into answers
-- INSERT INTO answers (question_id, user_id, body) VALUES
-- (1, 2, 'PostgreSQL is an open-source relational database.'),
-- (2, 1, 'You can use Docker to run PostgreSQL by pulling the official image.');

-- -- Insert initial data into comments
-- INSERT INTO comments (answer_id, user_id, body) VALUES
-- (1, 1, 'Thanks for the explanation!'),
-- (2, 2, 'This is very helpful, thank you!');