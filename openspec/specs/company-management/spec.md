# company-management Specification

## Purpose

Lets Telemedi manage client companies and the employer details printed on referrals, choose which company to work in, and keep each company's data visible only to that company's users and to Telemedi.

## Requirements

### Requirement: Company records
Telemedi SHALL be able to create and edit a company with a name, town, optional street, building number, optional flat number, postal code and NIP. All text SHALL be trimmed, and every field that isn't optional SHALL be non-empty. Users with any other role SHALL NOT create, edit or delete companies.

#### Scenario: Telemedi creates a company
- **WHEN** Telemedi submits valid company details
- **THEN** the company is created and appears in the company list and the switcher

#### Scenario: Telemedi edits a company
- **WHEN** Telemedi changes a company's details and saves
- **THEN** the new details are stored and shown

#### Scenario: HR user tries to manage a company
- **WHEN** an admin or operator invokes creating, editing or deleting a company
- **THEN** the request is rejected and nothing changes

### Requirement: NIP and postal code validation
The NIP SHALL be 10 digits with a valid checksum. Spaces and hyphens SHALL be removed before checking and storing. The postal code SHALL match `NN-NNN`. The NIP SHALL be unique among companies that aren't deleted.

#### Scenario: Valid NIP with separators
- **WHEN** Telemedi enters a valid NIP written as `521-000-11-26`
- **THEN** it is stored as `5210001126`

#### Scenario: NIP with a wrong checksum
- **WHEN** Telemedi enters 10 digits whose checksum doesn't match
- **THEN** saving is rejected with a Polish field error and the form keeps the entered values

#### Scenario: Duplicate NIP
- **WHEN** a company is saved with the NIP of another company that isn't deleted
- **THEN** saving is rejected with a Polish message

#### Scenario: NIP of a deleted company
- **WHEN** a new company uses the NIP of a deleted company
- **THEN** it is created

#### Scenario: Invalid postal code
- **WHEN** the postal code is not in `NN-NNN` form
- **THEN** saving is rejected with a Polish field error

### Requirement: Deleting companies
Only Telemedi SHALL be able to delete a company, after confirming. It SHALL be a soft delete. The company disappears from the list and the switcher, and its users are blocked as described in `user-accounts`.

#### Scenario: Telemedi deletes a company
- **WHEN** Telemedi confirms deleting a company
- **THEN** the company no longer appears in the list or switcher, stays in the database marked as deleted, and its users can no longer log in

#### Scenario: Deleted company was selected
- **WHEN** Telemedi had selected a company that has since been deleted
- **THEN** no company is selected and company pages send Telemedi to the company list

### Requirement: Company switcher
A Telemedi user SHALL work in one company at a time, chosen from a header switcher that lists the companies that aren't deleted, by name. The choice SHALL persist across requests in the same browser. Until a company is chosen, company-scoped pages SHALL send Telemedi to the company list. HR users SHALL see no switcher.

#### Scenario: Telemedi switches company
- **WHEN** Telemedi selects a company in the switcher
- **THEN** company-scoped pages show that company's data until another company is selected

#### Scenario: Telemedi without a selected company
- **WHEN** Telemedi opens a company-scoped page and has not selected a company
- **THEN** they are sent to the company list

#### Scenario: Tampered selection
- **WHEN** the stored selection names a company that doesn't exist or is deleted
- **THEN** it is ignored and treated as no selection

### Requirement: Company data isolation
Every company-scoped read and write SHALL be limited to one company. For an admin or operator, that is always their own company, regardless of any request input. For Telemedi, it is the selected company. A request naming a record from another company SHALL behave as if the record doesn't exist.

#### Scenario: Operator requests another company's user
- **WHEN** an operator submits an action with the ID of a user who belongs to another company
- **THEN** the action fails as not found and nothing changes

#### Scenario: HR user tries to choose a company
- **WHEN** an admin or operator submits a company selection
- **THEN** it is rejected and their company context stays their own company

### Requirement: Start pages
After login and when opening `/`, Telemedi SHALL be taken to the company list, and admins and operators to their company user list, until later modules define other start pages.

#### Scenario: Telemedi opens the app
- **WHEN** a logged-in Telemedi user opens `/`
- **THEN** they are taken to the company list

#### Scenario: Operator opens the app
- **WHEN** a logged-in operator opens `/`
- **THEN** they are taken to their company's user list
