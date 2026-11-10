# Spec Delta

## Purpose

Provide a runnable application with a Polish entry page and persistent server-side storage, both locally and in a single application container.

## ADDED Requirements

### Requirement: Polish application entry page
The application SHALL serve a minimal desktop entry page at `/` with Polish user-facing text, Polish document language and the product name. It SHALL load its styles without relying on externally hosted assets at runtime.

#### Scenario: Open the application
- **WHEN** a user opens `/` on the running application
- **THEN** the response succeeds and the browser displays the styled Polish entry page without missing assets
- **AND** the document language is `pl`

### Requirement: Server-only configurable database access
The application SHALL access its file-based database only from server code, using the database location supplied by its environment. Database files and credentials SHALL NOT be included in browser assets or served as public files.

#### Scenario: Use an isolated database
- **WHEN** server code connects with an environment pointing to a temporary database file
- **THEN** queries use that file without opening or changing the development database

#### Scenario: Inspect browser resources
- **WHEN** a user receives the entry page and its browser assets
- **THEN** those resources contain neither a database client nor private environment values or database contents

### Requirement: Persistent single-container runtime
The application SHALL run in one container without another application or database service. The database and its related files SHALL reside in a writable mounted directory and survive replacement of the application container using the same mount.

#### Scenario: Recreate the application container
- **GIVEN** a database on the mounted directory contains a synthetic verification record
- **WHEN** the container is removed and recreated using the same mount
- **THEN** the application serves `/` successfully and the verification record is still readable through the configured server database connection

#### Scenario: Start with an empty storage volume
- **WHEN** the application starts with a new writable storage volume and the documented environment
- **THEN** database initialization succeeds and the entry page is available without manually creating a database file
