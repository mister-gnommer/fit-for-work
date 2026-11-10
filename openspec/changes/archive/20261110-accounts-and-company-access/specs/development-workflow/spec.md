# Spec Delta

## MODIFIED Requirements

### Requirement: Browser smoke verification
The browser test command SHALL start a documented application server on its own temporary database, which is migrated and seeded with synthetic accounts before the server starts, and SHALL NOT read or change the developer database. Tests SHALL use Chromium. The project SHALL keep at most five end-to-end tests.

#### Scenario: Verify a running application in Chromium
- **WHEN** the browser test command runs against the prepared application
- **THEN** Chromium loads `/`, verifies the Polish document language and the login page, logs in with a seeded synthetic account, and reports application page errors as failures
- **AND** the developer database remains unchanged

## ADDED Requirements

### Requirement: Demo data command
The repository SHALL provide a documented command that loads the synthetic demo accounts and companies from `docs/seed/demo.json` into the configured database. Running it again SHALL NOT create duplicates or change existing records. The README SHALL list the demo logins.

#### Scenario: Load demo data into an empty database
- **WHEN** a contributor runs the demo data command on a migrated empty database
- **THEN** the Telemedi user, the three demo companies, their admins and operators exist and can log in with the documented demo password

#### Scenario: Run the demo command twice
- **WHEN** the demo data command runs on a database that already holds the demo data
- **THEN** the user and company counts stay the same
