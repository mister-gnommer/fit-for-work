# referral-templates Specification

## Purpose

Lets a company's HR, and Telemedi working in that company, keep named sets of risk factors with exposure levels for recurring jobs, ready to apply when issuing a referral.

## Requirements

### Requirement: Template records
Any user working in a company context SHALL be able to list, create and edit that company's templates. A template has a name and at least one risk factor. Each factor has an optional exposure level. Names and exposure levels SHALL be trimmed, and an empty exposure level SHALL be stored as empty, not as an empty string.

#### Scenario: Operator creates a template
- **WHEN** an operator saves a template named "Magazynier" with two factors, one of them with the exposure level "85 dB"
- **THEN** the template appears in the company's template list, and opening it shows both factors and the exposure level

#### Scenario: Template without factors
- **WHEN** a user saves a template without choosing any factor
- **THEN** saving is rejected with a Polish error and the form keeps the entered values

#### Scenario: Missing name
- **WHEN** a user saves a template without a name
- **THEN** saving is rejected with a Polish field error on the name

#### Scenario: Editing the factors
- **WHEN** a user removes one factor from a template, adds another and changes an exposure level, then saves
- **THEN** the template holds exactly the newly chosen factors with the new exposure level

### Requirement: Factors a template may contain
A template SHALL contain only predefined factors and the company's own factors that aren't deleted, each at most once. Any other factor SHALL be rejected and nothing SHALL be saved.

#### Scenario: Predefined and own factors
- **WHEN** a user saves a template with a predefined factor and one of the company's own factors
- **THEN** the template is saved with both

#### Scenario: Another company's factor
- **WHEN** a submitted template contains a factor that belongs to another company
- **THEN** saving is rejected and the template is unchanged

#### Scenario: Deleted factor
- **WHEN** a submitted template contains a factor that has been deleted
- **THEN** saving is rejected and the template is unchanged

### Requirement: Templates follow their factors
Templates SHALL reference factors, not copy them. A renamed company factor SHALL show its new name in every template that uses it. A deleted factor SHALL no longer appear in any template.

#### Scenario: Renamed factor
- **WHEN** a company renames one of its factors that a template uses
- **THEN** the template shows the new name

#### Scenario: Deleted factor disappears
- **WHEN** a company deletes one of its factors that a template uses
- **THEN** the template no longer lists that factor, and its other factors are unchanged

### Requirement: Template names unique within a company
A template name SHALL be unique among a company's templates that aren't deleted. Other companies' templates and deleted templates SHALL NOT block it.

#### Scenario: Duplicate name in the same company
- **WHEN** a user saves a template with the name of another non-deleted template of the same company
- **THEN** saving is rejected with a Polish field error on the name

#### Scenario: Same name in another company or after deletion
- **WHEN** a user saves a template whose name belongs to another company's template or to a deleted template of the same company
- **THEN** the template is saved

### Requirement: Templates are scoped to their company
Users SHALL see, open, edit and delete only the templates of the company they work in. Another company's template SHALL be treated as not found.

#### Scenario: Opening another company's template
- **WHEN** an operator opens the edit page, or submits an edit or delete, for a template of another company
- **THEN** the template is treated as not found and nothing changes

### Requirement: Soft deleting templates
Any user working in a company context SHALL be able to delete that company's templates after confirming. A deleted template SHALL stay in the database, marked as deleted, and SHALL NOT appear in the list or be opened or edited.

#### Scenario: Operator deletes a template
- **WHEN** an operator deletes a template and confirms
- **THEN** the template disappears from the list and stays in the database marked as deleted

### Requirement: Demo templates
The demo-data command SHALL load the templates listed for each company in the demo data file, with their factors and exposure levels. Running it again SHALL NOT create duplicates.

#### Scenario: Loading demo data twice
- **WHEN** the demo-data command runs twice on the same database
- **THEN** the demo company has exactly the templates listed in the demo data file
