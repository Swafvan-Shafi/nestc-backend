-- Run these commands in your PostgreSQL database to update the existing schema:

CREATE TYPE user_gender AS ENUM ('male', 'female', 'other');

ALTER TABLE users ADD COLUMN gender user_gender;
