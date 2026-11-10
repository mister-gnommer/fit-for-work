# Spec Delta

## Purpose

Lets a company's HR, and Telemedi working in that company, find the company's referrals, follow their status and download their PDFs again, and lets Telemedi change statuses and remove referrals.

## ADDED Requirements

### Requirement: Referral list
Any user working in a company context SHALL see a list of that company's referrals that aren't deleted, newest first. Each row SHALL show the employee's name, the exam type, the issue date, the deadline and the status, with links to the referral's summary and its PDF.

#### Scenario: Operator opens the list
- **WHEN** an operator opens the referral list after two referrals were created in their company
- **THEN** both are listed, the newer one first, each with its employee name, exam type, issue date, deadline and status

#### Scenario: Downloading an existing referral's PDF
- **WHEN** a user follows a listed referral's PDF link
- **THEN** the referral's PDF is downloaded

#### Scenario: Empty list
- **WHEN** a company has no referrals
- **THEN** the list says there are no referrals and offers to create one

### Requirement: List shows frozen data
The list SHALL show the data saved in each referral when it was created. Later edits to the employee, and deleting the employee, SHALL NOT change or hide the referral.

#### Scenario: Deleted employee
- **WHEN** an employee with a referral is deleted
- **THEN** the referral stays in the list with the employee's name as it was issued

#### Scenario: Renamed employee
- **WHEN** an employee's last name is changed after a referral was issued
- **THEN** the list still shows the name printed on that referral

### Requirement: Referrals are scoped to their company
Users SHALL see, open, update and delete only the referrals of the company they work in. Another company's referral SHALL be treated as not found.

#### Scenario: Another company's referral
- **WHEN** a user opens the summary or the PDF of a referral of another company, or Telemedi working in one company submits a status change or delete for another company's referral
- **THEN** the referral is treated as not found and nothing changes

### Requirement: Telemedi changes statuses
Telemedi SHALL be able to set a referral's status to any of the five statuses (created, in progress, confirmed, done, cancelled), from any status. Admins and operators SHALL see the status but SHALL NOT be able to change it.

#### Scenario: Telemedi changes a status
- **WHEN** Telemedi, with the company selected, sets a referral's status to "Zrealizowane" (done)
- **THEN** the new status is stored and shown on the summary and in the list

#### Scenario: Status back from cancelled
- **WHEN** Telemedi sets a cancelled referral back to "W realizacji" (in progress)
- **THEN** the status changes, because no transition rules apply

#### Scenario: Operator can't change a status
- **WHEN** an operator or admin submits a status change
- **THEN** it is rejected and the status is unchanged, and the summary page offers them no status control

#### Scenario: Unknown status
- **WHEN** a status change submits a value that isn't one of the five statuses
- **THEN** it is rejected and the status is unchanged

### Requirement: Telemedi deletes referrals
Telemedi SHALL be able to delete a referral after confirming. A deleted referral SHALL stay in the database, marked as deleted, and SHALL NOT appear in the list, and its summary and PDF SHALL be treated as not found. Admins and operators SHALL NOT be able to delete referrals.

#### Scenario: Telemedi deletes a referral
- **WHEN** Telemedi deletes a referral and confirms
- **THEN** it disappears from the list, its summary and PDF are not found, and it stays in the database marked as deleted

#### Scenario: Operator can't delete
- **WHEN** an operator or admin submits a delete for a referral
- **THEN** it is rejected and the referral is unchanged, and the summary page offers them no delete button
