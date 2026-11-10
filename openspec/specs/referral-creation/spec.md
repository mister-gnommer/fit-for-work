# referral-creation Specification

## Purpose

Lets HR, and Telemedi for the selected company, issue an occupational medicine referral for an employee: fill in the form's data, freeze it as a snapshot, and download the official form as a PDF straight away.

## Requirements

### Requirement: Choose the employee first
Creating a referral SHALL start by choosing one of the company's employees who aren't deleted. Only after an employee is chosen SHALL the referral form be shown, with that employee's name, position and work description.

#### Scenario: Start a referral
- **WHEN** a user in a company context opens the new referral page
- **THEN** they can choose from the company's employees who aren't deleted, and after choosing one they see the referral form for that employee

#### Scenario: Employee from another company or deleted
- **WHEN** the form is requested or submitted for an employee who belongs to another company or is deleted
- **THEN** it fails as not found and no referral is created

### Requirement: Referral form fields
The form SHALL collect:
- the exam type: pre-employment, periodic or follow-up
- employed vs. taking up work
- the position and work description, both required and pre-filled from the employee
- one or more risk factors from the predefined and the company's own factors, each with an optional exposure level of at most 200 characters
- a deadline

All text SHALL be trimmed. Invalid input SHALL be rejected with Polish field errors, keeping the entered values.

#### Scenario: Pre-filled from the employee
- **WHEN** the form opens for an employee
- **THEN** the position and work description fields contain the employee's current values and can be edited for this referral only

#### Scenario: No factor selected
- **WHEN** the form is submitted without any risk factor
- **THEN** it is rejected with a Polish error and the entered values are kept

#### Scenario: Factors grouped like the form
- **WHEN** the form is shown
- **THEN** the selectable factors appear under the five official category headings I–V, predefined factors and the company's own factors that aren't deleted, without other companies' factors

#### Scenario: Unknown or deleted factor submitted
- **WHEN** a submission names a factor that doesn't exist, is deleted or belongs to another company
- **THEN** it is rejected and no referral is created

### Requirement: Employment status follows the exam type
The employment status SHALL default to "taking up work" for a pre-employment exam and to "employed" for periodic and follow-up exams, and SHALL be changeable before saving.

#### Scenario: Default from exam type
- **WHEN** the user picks "wstępne" as the exam type and doesn't change the employment status
- **THEN** the referral is saved as "taking up work"

#### Scenario: Override
- **WHEN** the user picks "okresowe" and changes the employment status to "taking up work"
- **THEN** the referral is saved as "taking up work"

### Requirement: Deadline
The deadline SHALL be a valid date in `yyyy-MM-dd` form that is not earlier than the creation date in Polish time.

#### Scenario: Deadline in the past
- **WHEN** the deadline is earlier than today in Polish time
- **THEN** saving is rejected with a Polish field error

#### Scenario: Deadline today
- **WHEN** the deadline is today in Polish time
- **THEN** the referral is created

### Requirement: Frozen snapshot
On creation, the system SHALL store a snapshot of everything printed on the form, validated when written. Later changes to the employee, the factors or the company SHALL NOT change an existing referral.

#### Scenario: Snapshot contents
- **WHEN** a referral is created
- **THEN** its snapshot holds the employer's name, NIP and address; the employee's name, sex, PESEL or ID document and birth date, and home address; the exam type and employment status; the position and work description; each chosen factor's category, name and exposure level; and the place and date of issue

#### Scenario: Employee edited after the referral
- **WHEN** a referral is created and the employee's position is then changed
- **THEN** the referral and its PDF still show the position entered on the referral

#### Scenario: Factor renamed or deleted after the referral
- **WHEN** a company factor used by a referral is renamed or deleted afterwards
- **THEN** the referral and its PDF still show the factor's name from when the referral was created

### Requirement: Place and date of issue
The place of issue SHALL be the company's town and the date of issue SHALL be the creation date in Polish time (Europe/Warsaw), in `yyyy-MM-dd` form.

#### Scenario: Created late in the evening
- **WHEN** a referral is created at 23:30 Polish time
- **THEN** its date of issue is that day, not the next day in UTC terms

### Requirement: New referral status
A newly created referral SHALL have the status "created" and SHALL record which user created it.

#### Scenario: Status after creation
- **WHEN** an operator creates a referral
- **THEN** it is stored with the status "created" and the operator as its creator

### Requirement: Immediate PDF download
After creating a referral, the user SHALL see a page summarising it with a link to download its PDF. The download SHALL return the official form rendered from the snapshot as a PDF file, and SHALL be available only to the referral's company users and to Telemedi with that company selected.

#### Scenario: Download right after creation
- **WHEN** a user creates a referral and clicks "Pobierz PDF"
- **THEN** the browser downloads a PDF of the official form with the referral's data

#### Scenario: Another company's referral
- **WHEN** a user requests the referral page or PDF of a referral that belongs to another company
- **THEN** it fails as not found and no data is returned

#### Scenario: Logged out
- **WHEN** a logged-out visitor requests a referral PDF
- **THEN** no PDF is returned and they are sent to the login page

### Requirement: Apply a template when starting a referral
When choosing the employee, the user SHALL be able to choose one of the company's templates that isn't deleted, or none. With a template, the referral form SHALL open with exactly the template's factors that aren't deleted ticked, and their exposure levels filled in. Everything SHALL stay editable before saving. The template SHALL NOT change the position or work description.

#### Scenario: Start from a template
- **WHEN** a user picks an employee and the template "Magazynier", then continues
- **THEN** the form shows the template's factors ticked with its exposure levels, and the position and work description of the employee

#### Scenario: Adjust after applying
- **WHEN** a user unticks one of the template's factors and edits another factor's exposure level before saving
- **THEN** the referral is saved with exactly the submitted factors and exposure levels

#### Scenario: Template with a deleted factor
- **WHEN** a template uses a factor that has since been deleted
- **THEN** applying it ticks only the template's factors that aren't deleted

#### Scenario: Another company's or a deleted template
- **WHEN** the form is requested with a template that belongs to another company or is deleted
- **THEN** it fails as not found

#### Scenario: Template edited after the referral
- **WHEN** a referral was created from a template and the template is edited afterwards
- **THEN** the referral and its PDF are unchanged

### Requirement: Demo referrals
The demo data command SHALL create the presentation company's referrals listed in the demo data. It SHALL use each referral's employee, exam type, deadline and status, and the factors of its template or its own listed factors. The snapshot SHALL be built the same way as for referrals created in the form. It SHALL create them only when the company has no referrals yet.

#### Scenario: Load demo referrals
- **WHEN** the demo data command runs on a migrated empty database
- **THEN** "Przykładowa Logistyka" has 5 referrals covering every status and exam type, and each one's PDF can be downloaded

#### Scenario: Run the demo command twice
- **WHEN** the demo data command runs again
- **THEN** the number of referrals stays the same
