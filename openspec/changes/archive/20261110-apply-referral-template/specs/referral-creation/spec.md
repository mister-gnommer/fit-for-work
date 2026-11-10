# Spec Delta

## ADDED Requirements

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
