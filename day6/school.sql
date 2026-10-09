-- School database for SQLite
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- Tables
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  credits INTEGER NOT NULL
);

CREATE TABLE enrolments (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  grade INTEGER CHECK (grade BETWEEN 0 AND 100),
  FOREIGN KEY (student_id) REFERENCES students (id),
  FOREIGN KEY (course_id) REFERENCES courses (id),
  UNIQUE (student_id, course_id)
);

-- Sample data
INSERT INTO students (name, email) VALUES
  ('Amina Hassan', 'amina.hassan@example.com'),
  ('Brian Otieno', 'brian.otieno@example.com'),
  ('Grace Wanjiku', 'grace.wanjiku@example.com'),
  ('David Mwangi', 'david.mwangi@example.com');

INSERT INTO courses (title, credits) VALUES
  ('Web Development', 4),
  ('Database Systems', 3),
  ('Data Analysis', 3);

INSERT INTO enrolments (student_id, course_id, grade) VALUES
  (1, 1, 85),
  (1, 2, 78),
  (2, 1, 72),
  (2, 2, NULL),
  (3, 1, 90),
  (3, 3, 88);

-- Query 1: all courses for one student (by name)
SELECT c.title, e.grade
FROM students s
JOIN enrolments e ON e.student_id = s.id
JOIN courses c ON c.id = e.course_id
WHERE s.name = 'Amina Hassan';

-- Query 2: all students on one course
SELECT s.name, s.email, e.grade
FROM courses c
JOIN enrolments e ON e.course_id = c.id
JOIN students s ON s.id = e.student_id
WHERE c.title = 'Web Development';

-- Query 3: number of students per course
SELECT c.title, COUNT(e.id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON e.course_id = c.id
GROUP BY c.id, c.title
ORDER BY student_count DESC;

-- Query 4: students who have no enrolments
SELECT s.name, s.email
FROM students s
LEFT JOIN enrolments e ON e.student_id = s.id
WHERE e.id IS NULL;

-- Query 5: update one enrolment's grade (Brian Otieno on Database Systems)
UPDATE enrolments
SET grade = 80
WHERE student_id = 2 AND course_id = 2;

-- Check the update
SELECT s.name, c.title, e.grade
FROM enrolments e
JOIN students s ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
WHERE e.student_id = 2 AND e.course_id = 2;