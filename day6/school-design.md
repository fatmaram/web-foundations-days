# School Database Design

## Overview

The school database tracks students and the courses they take. It holds three tables named students and courses and enrolments. SQLite runs the database.

## Tables

### students

- Stores one row for each student.
- id is the primary key.
- name holds the full name and always needs a value.
- email holds the contact address. Each email is unique so two students can never share one.

### courses

- Stores one row for each course the school offers.
- id is the primary key.
- title names the course and always needs a value.
- credits holds the credit value of the course.

### enrolments

- Stores one row each time a student joins a course.
- id is the primary key.
- student_id points to a row in students.
- course_id points to a row in courses.
- grade holds a mark from 0 to 100. The value stays empty until the teacher grades the work.
- A unique rule on student_id and course_id stops the same student joining the same course twice.

## Relationships

- One student has many enrolments. That is a one-to-many relationship.
- One course has many enrolments. That is a second one-to-many relationship.
- Students and courses form a many-to-many relationship. One student takes many courses and one course holds many students.
- A join table is needed because one column in students or courses can hold only one value per row. The enrolments table stores one row for every student and course pair. It also holds the grade because a grade belongs to the pair and to neither side alone.

## Index

- Index to add: `CREATE INDEX idx_enrolments_course_id ON enrolments (course_id);`
- Reason: Queries such as all students on one course and the count per course search enrolments by course_id. The unique rule already covers searches that start with student_id. An index on course_id lets the database jump straight to the matching rows when the table grows to thousands of enrolments.

## SQL or NoSQL

I would choose SQL for this system. School data has a clear structure and strong links between records. Students and courses and grades fit tables with fixed columns. Foreign keys keep every enrolment attached to a real student and a real course. Unique rules stop duplicate emails and double enrolments. Joins answer questions such as who sits in a course or which students have no enrolments with short queries. Transactions make a grade update finish fully or never happen. A NoSQL document store suits data with changing shapes or huge write volumes. A school database has neither need.