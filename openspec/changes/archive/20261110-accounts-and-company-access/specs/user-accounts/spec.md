# Spec Delta

## Purpose

Lets Telemedi staff and client HR users log in with an email and password, gives each user one role, and controls who can create, change the password of and delete which accounts.

## ADDED Requirements

### Requirement: Login with email and password
The system SHALL let an active user log in with email and password on a Polish login page and log out from any logged-in page. Email matching SHALL ignore letter case. A failed login SHALL show one generic Polish error that doesn't reveal whether the email exists. There SHALL be no public sign-up and no self-service password reset.

#### Scenario: Successful login
- **WHEN** an active user submits their correct email and password
- **THEN** they are logged in and taken to their start page

#### Scenario: Wrong credentials
- **WHEN** someone submits an unknown email, or a known email with a wrong password
- **THEN** login fails with the same generic Polish message and no session is created

#### Scenario: Sign-up is unavailable
- **WHEN** anyone calls the authentication service's sign-up endpoint directly
- **THEN** the request is rejected and no user is created

#### Scenario: Logout
- **WHEN** a logged-in user logs out
- **THEN** their session ends and protected pages send them to the login page

### Requirement: Logged-out access
Every page except the login page SHALL require a logged-in active user, and every server-side write SHALL check the user itself instead of relying on the page.

#### Scenario: Open a protected page logged out
- **WHEN** a logged-out visitor opens any page other than the login page
- **THEN** they are sent to the login page

#### Scenario: Call a write action without a session
- **WHEN** a request invokes any server-side write without a valid session
- **THEN** the write is rejected and nothing changes

### Requirement: Roles
Each user SHALL have exactly one role. A `TELEMEDI` user belongs to no company. An `ADMIN` or `OPERATOR` user belongs to exactly one company. A company SHALL have at most one admin who isn't deleted. Admins SHALL have every operator permission, plus the user-management rights in this spec.

#### Scenario: Second admin for a company
- **WHEN** someone tries to create an admin for a company that already has an admin who isn't deleted
- **THEN** the creation is rejected with a Polish message and no user is created

#### Scenario: HR user without a company
- **WHEN** an `ADMIN` or `OPERATOR` would be stored without a company
- **THEN** the creation is rejected

### Requirement: First Telemedi account
When the application starts and no Telemedi user who isn't deleted exists, the system SHALL create one from the configured name, email and password. If one already exists, the system SHALL leave every account unchanged. If none exists and the settings are missing, startup SHALL log an error and continue.

#### Scenario: Start with an empty database
- **WHEN** the application starts on a new database with the Telemedi seed settings provided
- **THEN** a Telemedi user with those details exists and can log in

#### Scenario: Restart with an existing Telemedi account
- **WHEN** the application restarts with different Telemedi seed settings
- **THEN** no user is created or changed

### Requirement: Creating company users
Accounts SHALL be created only by an authorized user, who enters the name, email and initial password. Telemedi SHALL be able to create the company's admin when it has none, and operators. An admin SHALL be able to create operators in their own company. Operators SHALL NOT create accounts. Emails SHALL be unique across all users, deleted ones included.

#### Scenario: Admin creates an operator
- **WHEN** an admin submits a valid name, email and password
- **THEN** an operator is created in the admin's company and can log in with that password

#### Scenario: Operator tries to create a user
- **WHEN** an operator invokes user creation
- **THEN** the request is rejected and no user is created

#### Scenario: Email already used
- **WHEN** a new account uses the email of any existing user, including a deleted one, in any letter case
- **THEN** the creation is rejected with a Polish message

#### Scenario: Invalid input
- **WHEN** the name is empty, the email is malformed, or the password is shorter than 8 or longer than 128 characters
- **THEN** the creation is rejected and the form shows Polish field errors with the entered values kept, except the password

### Requirement: Setting passwords
The person who manages an account SHALL be able to set a new password for it at any time, with the same length rules as creation. Telemedi SHALL be able to set the password of any company user. An admin SHALL be able to set the passwords of operators in their company. Setting a password SHALL end the target user's existing sessions.

#### Scenario: Admin resets an operator's password
- **WHEN** an admin sets a new password for an operator in their company
- **THEN** the operator can log in only with the new password, and their open sessions end

#### Scenario: Admin targets another company's user
- **WHEN** an admin tries to set the password of a user outside their company, or of a Telemedi user
- **THEN** the request is rejected and nothing changes

### Requirement: Deleting users
Deleting a user SHALL be a soft delete: the user disappears from the UI, stays in the database and keeps their email. Telemedi SHALL be able to delete any company user. An admin SHALL be able to delete operators in their company. An operator SHALL be able to delete only their own account. Nobody SHALL delete a Telemedi user through the UI.

#### Scenario: Admin deletes an operator
- **WHEN** an admin deletes an operator in their company
- **THEN** the operator no longer appears in the user list, their sessions end, and their record remains in the database marked as deleted

#### Scenario: Operator deletes own account
- **WHEN** an operator confirms deleting their own account
- **THEN** the account is soft deleted, the operator is logged out and sent to the login page

#### Scenario: Operator deletes another user
- **WHEN** an operator tries to delete any account other than their own
- **THEN** the request is rejected and nothing changes

#### Scenario: Telemedi replaces an admin
- **WHEN** Telemedi deletes a company's admin
- **THEN** the company has no admin, and Telemedi can create a new one

### Requirement: Blocked accounts
A deleted user, or a user whose company is deleted, SHALL NOT log in or use an existing session.

#### Scenario: Deleted user logs in
- **WHEN** a deleted user submits their correct email and password
- **THEN** login fails with the generic Polish message

#### Scenario: Session of a user who has just been deleted
- **WHEN** a user who still holds a session cookie is deleted, and then makes a request
- **THEN** they are treated as logged out

#### Scenario: User of a deleted company
- **WHEN** a company is deleted and one of its users makes a request or tries to log in
- **THEN** they are treated as logged out and login fails

### Requirement: Company user list
Every logged-in user in a company context SHALL see a Polish list of that company's users who aren't deleted, with name, email and role, ordered by creation time. The actions shown SHALL be only those the viewer is allowed to perform.

#### Scenario: Operator views the list
- **WHEN** an operator opens the user list
- **THEN** they see their company's users who aren't deleted, and only a delete action on their own row

#### Scenario: Admin views the list
- **WHEN** an admin opens the user list
- **THEN** they see an action to create operators, plus password and delete actions on operator rows only
