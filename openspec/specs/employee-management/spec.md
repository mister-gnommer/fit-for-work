# employee-management Specification

## Purpose

Lets a company's HR, and Telemedi working in that company, keep the employee records whose identity, address, position and work description are printed on referrals.

## Requirements

### Requirement: Employee records
Any user working in a company context SHALL be able to list, create and edit that company's employees. An employee has a first name, last name, sex, home town, optional street, building number, optional flat number, position and work description. All text SHALL be trimmed, and every field that isn't optional SHALL be non-empty. An empty optional field SHALL be stored as empty, not as an empty string.

#### Scenario: Operator creates an employee
- **WHEN** an operator submits valid employee details
- **THEN** the employee is created and appears in the company's employee list

#### Scenario: Telemedi edits an employee in the selected company
- **WHEN** Telemedi, with a company selected in the switcher, changes an employee's position and saves
- **THEN** the new position is stored and shown in that company's list

#### Scenario: Missing required field
- **WHEN** a user submits the form without a position
- **THEN** saving is rejected with a Polish field error and the form keeps the entered values

### Requirement: Employee identity
An employee SHALL have either a PESEL or, without one, an ID document name, an ID document number (series and number) and a date of birth. A PESEL SHALL be 11 digits with a valid checksum. When a PESEL is given, the ID document fields and date of birth SHALL be stored empty. A date of birth SHALL be a real calendar date that isn't in the future.

#### Scenario: Valid PESEL
- **WHEN** a user saves an employee with a PESEL that has a valid checksum
- **THEN** the employee is saved with that PESEL

#### Scenario: PESEL with a wrong checksum
- **WHEN** a user enters 11 digits whose checksum doesn't match
- **THEN** saving is rejected with a Polish field error on the PESEL

#### Scenario: No PESEL and no ID document
- **WHEN** a user leaves the PESEL empty and doesn't fill in the ID document name, number and date of birth
- **THEN** saving is rejected with a Polish field error on each missing field

#### Scenario: No PESEL, with ID document
- **WHEN** a user leaves the PESEL empty and fills in the ID document name, number and a past date of birth
- **THEN** the employee is saved without a PESEL

#### Scenario: PESEL and ID document both given
- **WHEN** a user enters a valid PESEL and also fills in the ID document fields
- **THEN** the employee is saved with the PESEL, and the ID document fields and date of birth are empty

### Requirement: PESEL unique within a company
A PESEL SHALL be unique among a company's employees who aren't deleted. Other companies' employees and deleted employees SHALL NOT block it.

#### Scenario: Duplicate PESEL in the same company
- **WHEN** a user saves an employee with the PESEL of another non-deleted employee of the same company
- **THEN** saving is rejected with a Polish field error on the PESEL

#### Scenario: Same PESEL in another company
- **WHEN** a user saves an employee whose PESEL belongs to an employee of a different company
- **THEN** the employee is saved

#### Scenario: PESEL of a deleted employee
- **WHEN** a user saves an employee with the PESEL of a deleted employee of the same company
- **THEN** the employee is saved

### Requirement: Employees are scoped to their company
Users SHALL see, open, edit and delete only the employees of the company they work in. Another company's employee SHALL be treated as not found.

#### Scenario: Opening another company's employee
- **WHEN** an operator opens the edit page, or submits an edit or delete, for an employee of another company
- **THEN** the employee is treated as not found and nothing changes

#### Scenario: Telemedi switches company
- **WHEN** Telemedi switches from one company to another
- **THEN** the employee list shows only the newly selected company's employees

### Requirement: Soft deleting employees
Any user working in a company context SHALL be able to delete that company's employees after confirming. A deleted employee SHALL stay in the database, marked as deleted, and SHALL NOT appear in the list or be opened or edited.

#### Scenario: Operator deletes an employee
- **WHEN** an operator deletes an employee and confirms
- **THEN** the employee disappears from the list and stays in the database marked as deleted

#### Scenario: Editing a deleted employee
- **WHEN** a user opens the edit page of a deleted employee
- **THEN** the employee is treated as not found

### Requirement: Demo employees
The demo-data command SHALL load the employees listed for each company in the demo data file, including the employee without a PESEL. Running it again SHALL NOT create duplicates.

#### Scenario: Loading demo data twice
- **WHEN** the demo-data command runs twice on the same database
- **THEN** the demo company has exactly the employees listed in the demo data file
