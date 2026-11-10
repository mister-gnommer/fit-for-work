# risk-factor-management Specification

## Purpose

Maintains the list of risk factors HR picks from when building templates and referrals: the read-only predefined factors from Annex 1 of the regulation, grouped in the form's five categories, plus each company's own plain-text factors.

## Requirements

### Requirement: Risk categories
Every risk factor SHALL belong to exactly one of the five categories of the official form, shown in Polish with the form's wording and in the form's order: I "Czynniki fizyczne", II "Pyły", III "Czynniki chemiczne", IV "Czynniki biologiczne", V "Inne czynniki, w tym niebezpieczne".

#### Scenario: Factor list grouped by category
- **WHEN** a user in a company context opens the risk factor page
- **THEN** the factors appear under the five Polish category headings in the order I–V

#### Scenario: Unknown category
- **WHEN** a factor is submitted with a category outside the five
- **THEN** saving is rejected with a Polish field error

### Requirement: Predefined factors
The system SHALL provide the predefined factors listed in the repository's predefined-factor data, available to every company. Seeding SHALL add any missing predefined factor and SHALL NOT change or remove existing ones. Nobody, Telemedi included, SHALL edit or delete a predefined factor.

#### Scenario: Seed a new database
- **WHEN** the application starts on a newly migrated database
- **THEN** all predefined factors exist in their categories

#### Scenario: Seed again
- **WHEN** seeding runs on a database that already has the predefined factors
- **THEN** the number of predefined factors stays the same

#### Scenario: Try to edit a predefined factor
- **WHEN** any user submits an edit or delete for a predefined factor
- **THEN** the request fails as not found and the factor is unchanged

#### Scenario: Predefined factors are read-only in the list
- **WHEN** a user views the risk factor page
- **THEN** predefined factors are marked as predefined and show no edit or delete actions

### Requirement: Company factors
Every user in a company context SHALL be able to add a factor to that company with a category and a trimmed, non-empty name of at most 200 characters, and to edit the category and name of the company's own factors. A company's own factors SHALL be visible only to that company's users and to Telemedi with that company selected.

#### Scenario: Operator adds a factor
- **WHEN** an operator adds "Podnoszenie ładunków powyżej 25 kg" under "Inne czynniki, w tym niebezpieczne"
- **THEN** it appears in that category for their company, with edit and delete actions

#### Scenario: Edit a company factor
- **WHEN** a user changes the name or category of one of their company's own factors
- **THEN** the change is stored and shown in the list

#### Scenario: Invalid name
- **WHEN** the name is empty or longer than 200 characters
- **THEN** saving is rejected with a Polish field error and the form keeps the entered values

#### Scenario: Another company's factor
- **WHEN** a user submits an edit or delete for a factor that belongs to another company
- **THEN** the request fails as not found and the factor is unchanged

#### Scenario: Telemedi switches company
- **WHEN** Telemedi switches from one company to another
- **THEN** the risk factor page shows the predefined factors plus only the newly selected company's own factors

### Requirement: No duplicate names in a category
A company factor's name SHALL NOT equal the name of a predefined factor or of another of the company's own factors that isn't deleted, in the same category. The comparison SHALL use the trimmed name. The same name in a different category, or in another company, SHALL be allowed.

#### Scenario: Duplicate of a predefined factor
- **WHEN** a user adds "Hałas" under "Czynniki fizyczne"
- **THEN** saving is rejected with a Polish message that the factor already exists in this category

#### Scenario: Duplicate of an own factor
- **WHEN** a user adds or renames a factor to the name of another of the company's own factors in the same category
- **THEN** saving is rejected with the same Polish message

#### Scenario: Name of a deleted factor
- **WHEN** a user adds a factor with the name of one of the company's deleted factors in the same category
- **THEN** it is created

### Requirement: Deleting company factors
Every user in a company context SHALL be able to delete the company's own factors after confirming. It SHALL be a soft delete: the factor disappears from the list and stays in the database.

#### Scenario: Delete a company factor
- **WHEN** a user confirms deleting one of their company's own factors
- **THEN** it no longer appears on the risk factor page and remains in the database marked as deleted

### Requirement: Demo risk factors
The demo data command SHALL add the presentation company's own factors listed in the demo data, along with the predefined factors. Running it again SHALL NOT create duplicates.

#### Scenario: Load demo factors
- **WHEN** the demo data command runs on a migrated empty database
- **THEN** "Przykładowa Logistyka" has its demo factors, and the predefined factors exist

#### Scenario: Run the demo command twice
- **WHEN** the demo data command runs again
- **THEN** the number of predefined and company factors stays the same
