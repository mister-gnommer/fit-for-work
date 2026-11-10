# application-runtime Specification

## Purpose

Provide a runnable application with a Polish entry page and persistent server-side storage, both locally and in a single application container.

## Requirements

### Requirement: Polish application entry page
The application SHALL serve its pages with Polish user-facing text and Polish document language. Opening `/` SHALL send a logged-out visitor to a styled Polish login page that shows the product name, and a logged-in user to their start page. Pages SHALL load their styles without relying on externally hosted assets at runtime.

#### Scenario: Open the application
- **WHEN** a logged-out user opens `/` on the running application
- **THEN** the browser ends on the styled Polish login page with the product name, without missing assets
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
- **THEN** database initialization succeeds and the login page is available without manually creating a database file
- **AND** the first Telemedi account from the environment can log in

### Requirement: Authentication configuration
The runtime SHALL take its authentication secret and public base URL from the environment. They SHALL NOT be committed or built into browser assets. Documented local examples SHALL use placeholder values only.

#### Scenario: Missing secret in the container
- **WHEN** the container is started without an authentication secret
- **THEN** startup fails with a clear configuration error and doesn't serve the application with a default secret

#### Scenario: Inspect browser resources
- **WHEN** a user receives the login page and its browser assets
- **THEN** those resources contain neither the authentication secret nor the Telemedi seed password
