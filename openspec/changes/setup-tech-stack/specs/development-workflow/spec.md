# Spec Delta

## Purpose

Let contributors reproduce the application environment and verify changes through documented commands without changing application data.

## ADDED Requirements

### Requirement: Reproducible project installation
The repository SHALL provide a committed dependency lockfile, exact direct dependency versions and documented runtime prerequisites. A clean checkout SHALL install with `npm ci` without altering existing project documentation or agent integrations.

#### Scenario: Install a fresh checkout
- **WHEN** a contributor follows the documented prerequisites and runs `npm ci`
- **THEN** the locked dependency set installs successfully
- **AND** tracked documentation and agent integration files remain unchanged

### Requirement: Explicit development and verification commands
The repository SHALL document commands for development startup, production build/start, linting, type checking, database client generation, development migrations, deployment migrations, unit/integration tests and browser tests. Verification commands SHALL exit nonzero when their checks fail, and automated test commands SHALL terminate without watch mode.

#### Scenario: Verify a clean checkout
- **WHEN** a contributor prepares the environment and browser dependencies, then runs the documented static checks, tests and production build/start commands
- **THEN** each command completes successfully and the production server serves `/`

#### Scenario: Static validation detects invalid code
- **WHEN** a contributor runs type checking against code containing a type error
- **THEN** the command exits nonzero independently of production compilation

### Requirement: Isolated integration database
Integration tests SHALL use real temporary database files, apply repository migrations when present, and clean up their resources. They SHALL NOT use mocked database clients or read, reset or modify a developer's database.

#### Scenario: Persist data through a real connection
- **WHEN** an integration test writes synthetic data, closes its connection and opens another connection to the same temporary file
- **THEN** the data remains readable
- **AND** the developer database remains unchanged and temporary resources are removed after the test

### Requirement: Browser smoke verification
The browser test command SHALL start or target a documented application server and verify the entry page using Chromium. Setup SHALL introduce at most one end-to-end test, leaving the project within its limit of five main-flow tests.

#### Scenario: Verify a running application in Chromium
- **WHEN** the browser test command runs against the prepared application
- **THEN** Chromium loads `/`, verifies the Polish document language and visible application heading, and reports application page errors as failures
