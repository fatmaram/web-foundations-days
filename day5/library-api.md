# Library API Design

## Overview

The Library API manages the books resource of a library. Every request and response uses JSON. Paths start from the base URL of the server.

## Endpoints

### 1. List all books

- Method: GET
- Path: `/books`
- Description: Returns every book in the library.
- Request body: none
- Success status code: 200 OK

### 2. Get one book

- Method: GET
- Path: `/books/{id}`
- Description: Returns the single book with the given id.
- Request body: none
- Success status code: 200 OK

### 3. Create a book

- Method: POST
- Path: `/books`
- Description: Adds a new book to the library.
- Example request body: `{"title": "Things Fall Apart", "author": "Chinua Achebe", "isbn": "9780385474542", "year": 1958}`
- Success status code: 201 Created

### 4. Update a book

- Method: PUT
- Path: `/books/{id}`
- Description: Replaces the details of the book with the given id.
- Example request body: `{"title": "Things Fall Apart", "author": "Chinua Achebe", "isbn": "9780385474542", "year": 1959}`
- Success status code: 200 OK

### 5. Delete a book

- Method: DELETE
- Path: `/books/{id}`
- Description: Removes the book with the given id from the library.
- Request body: none
- Success status code: 204 No Content

### 6. List books by an author

- Method: GET
- Path: `/books?author=Chinua%20Achebe`
- Description: Returns every book written by the author named in the query parameter.
- Request body: none
- Success status code: 200 OK

## Error codes

### 400 Bad Request

- Meaning: The server rejects a request because the data is missing or invalid.
- Example: A client sends POST `/books` without a title or sends the year as the text abc.

### 404 Not Found

- Meaning: The server finds no book that matches the request.
- Example: A client sends GET `/books/999` and no book has the id 999. PUT and DELETE on a missing id return the same code.