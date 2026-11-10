# referral-pdf Specification

## Purpose

Turn a frozen referral snapshot into the official referral form (Annex 3a to the 1996 Ministry of Health regulation, Dz.U. 2023 poz. 607) as a printable A4 PDF that HR signs and stamps by hand.

## Requirements

### Requirement: Faithful copy of the official form
The rendered referral SHALL reproduce Annex 3a's wording, field order, footnote markers, the five factor categories I–V, the total factor count box, the employer signature space and the explanatory notes. It SHALL omit "Załącznik nr 3a", "WZÓR" and the legislative footnotes. The explanatory notes SHALL start on a new page.

#### Scenario: Render a typical referral
- **WHEN** a snapshot with an employee, a position and a few factors is rendered as a PDF
- **THEN** the result is an A4 PDF with two pages: the filled form, then the explanatory notes
- **AND** the form shows the employer details (name, address, NIP), the place and date of issue, the employee's full name, identity, home address, position and work description

#### Scenario: Long content
- **WHEN** the work description and factor lists are long enough to overflow the first page
- **THEN** the form flows onto further pages and the factor count box stays together with the signature space

### Requirement: Strike-throughs follow the referral data
The form SHALL strike through every option that does not apply and keep the one that does: the two unused exam types, the salutation and gendered word forms that don't match the employee's sex, and the whole employed or taking-up-work pair that doesn't apply.

#### Scenario: Female employee taking up work, pre-employment exam
- **WHEN** the snapshot has sex `FEMALE`, employment status `TAKING_UP_WORK` and exam type `PRE_EMPLOYMENT`
- **THEN** "okresowe" and "kontrolne" are struck, "wstępne" is not
- **AND** "Pana", "zamieszkałego" and "podejmującego" are struck, while "Panią", "zamieszkałą" and "podejmującą" are not
- **AND** "zatrudnionego/zatrudnioną" is struck as a whole

#### Scenario: Male employee already employed, periodic exam
- **WHEN** the snapshot has sex `MALE`, employment status `EMPLOYED` and exam type `PERIODIC`
- **THEN** only "okresowe" of the exam types is not struck
- **AND** "Panią", "zamieszkałą" and "zatrudnioną" are struck, and "podejmującego/podejmującą" is struck as a whole

### Requirement: Identity without PESEL
When the employee has a PESEL, the form SHALL print it. Otherwise it SHALL print the ID document's series and number and its name in the PESEL field, followed by the birth date when the snapshot has one.

#### Scenario: Employee with PESEL
- **WHEN** the snapshot has a PESEL
- **THEN** the PESEL field shows that PESEL

#### Scenario: Candidate without PESEL
- **WHEN** the snapshot has no PESEL but has ID document "AB 1234567", document name "paszport" and birth date 1990-01-31
- **THEN** the PESEL field shows "AB 1234567, paszport, data urodzenia: 1990-01-31"

### Requirement: Risk factors grouped by category with their count
The form SHALL list each factor under its category, in the order the snapshot gives them, as its name followed by " – " and its exposure level when one is set. A category without factors SHALL show only its title. The total count box SHALL show the number of factors across all categories.

#### Scenario: Factors in several categories
- **WHEN** the snapshot has three physical factors (one with an exposure level), no dusts, one chemical factor, no biological factors and four other factors
- **THEN** categories I, III and V list their factors, categories II and IV show only their titles
- **AND** the factor with an exposure level reads "<name> – <exposure level>"
- **AND** the count box shows 8

#### Scenario: No factors
- **WHEN** the snapshot has no factors
- **THEN** all five categories show only their titles and the count box shows 0

### Requirement: User text is printed literally
Every value from the snapshot SHALL be printed as plain text. Markup characters in user-entered values SHALL appear as written and SHALL NOT change the document.

#### Scenario: Markup in a work description
- **WHEN** the work description is `<b>Kierowca</b> & "magazynier"`
- **THEN** the form shows exactly that text, and no bold element is added to the document

### Requirement: Self-contained rendering
Rendering SHALL NOT make network requests. The PDF SHALL use a serif font that covers Polish characters. Rendering SHALL work both locally (after the documented browser install) and in the application container without extra setup.

#### Scenario: Polish characters
- **WHEN** the snapshot contains "Żółć", "ąęśćńź" and "Łódź"
- **THEN** the PDF shows them in the serif font, without missing-glyph boxes

#### Scenario: Render inside the container
- **WHEN** the application container renders a referral PDF with no network access beyond the container
- **THEN** a valid PDF is produced
