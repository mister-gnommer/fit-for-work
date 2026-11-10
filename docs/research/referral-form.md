# Skierowanie na badania lekarskie (wstępne / okresowe / kontrolne) - official form

## Source
- Act: Rozporządzenie Ministra Zdrowia i Opieki Społecznej z 30 maja 1996 r. w sprawie przeprowadzania badań lekarskich pracowników, zakresu profilaktycznej opieki zdrowotnej nad pracownikami oraz orzeczeń lekarskich wydawanych do celów przewidzianych w Kodeksie pracy (original Dz.U. 1996 nr 69 poz. 332).
- Current consolidated text: obwieszczenie Ministra Zdrowia z 1 marca 2023 r., **Dz.U. 2023 poz. 607** (status in ELI API: obowiązujący, checked 2026-11-10).
- Form: **Załącznik nr 3a "WZÓR"**, PDF page 28 of 33 of the consolidated text; explanatory notes (objaśnienia) on page 29. Legal basis for the form: § 4 ust. 3 of the regulation; issuing duty § 4 ust. 1 ("na podstawie skierowania wydanego przez pracodawcę"), § 4 ust. 1a (two copies, one goes to the examined person), § 4 ust. 2 (required content: exam type, position(s), working-conditions description).
- Annex 3a was introduced by the 2015 amendment (Dz.U. 2015 poz. 457, in force 2015-04-01) and its notes were revised by the 2023 amendment (Dz.U. 2023 poz. 73, in force 2023). The consolidated text also includes Dz.U. 2020 poz. 2131.
- Downloaded: `docs/research/source/dz2023-607-tj.pdf` (from https://eli.gov.pl/eli/DU/2023/607/ogl/pol/pdf). Also saved for the newer-amendment check: `dz2026_456.pdf`, `dz2026_726.pdf` (same host, `/eli/DU/2026/456|726/ogl/pol/pdf`). Metadata via https://api.sejm.gov.pl/eli/acts/DU/2023/607.
- Date checked: **2026-11-10**.
- Newer amendments after the consolidated text (read, both in force):
  - Dz.U. 2026 poz. 456 (rozp. MZ 2026-03-20, in force 2026-04-17): changes § 3 and certificate annexes nr 2, 3, 6, 7 (orzeczenie lekarskie; adds e-orzeczenie, individual health recommendations; the orzeczenie now states the date of the skierowanie). **Does not change § 4 or Annex 3a.**
  - Dz.U. 2026 poz. 726 (rozp. MZ 2026-05-29, next day after promulgation 2026-06-03): lead limits only (new § 13a). Does not touch the referral.
  - So the referral form is unchanged since 2023. Caveat: I verified by reading both amendments' text, not by a published post-2026 unified text (none found).

## Form structure (Załącznik nr 3a), in order
Footnote markers: `*)` Niepotrzebne skreślić (strike what does not apply); `**)` PESEL note; `***)` position note; `****)` working-conditions note.

1. Header, top left: `(oznaczenie pracodawcy)` - employer identification (free text; dotted line).
2. Header, top right: `(miejscowość, data)` - place and date.
3. Title: **SKIEROWANIE NA BADANIA LEKARSKIE** `(wstępne/okresowe/kontrolne*))` - exam type; strike two of three.
4. Fixed legal text: "Działając na podstawie art. 229 § 4a ustawy z dnia 26 czerwca 1974 r. - Kodeks pracy ..., kieruję na badania lekarskie:" (Acting under Labour Code art. 229 § 4a, I refer for medical examination:).
5. **Pana/Panią*)** `(imię i nazwisko)` - mr/ms (strike one); full name.
6. **nr PESEL****)** - PESEL. Note `**)`: for a person without PESEL: "seria, numer i nazwa dokumentu potwierdzającego tożsamość, a w przypadku osoby przyjmowanej do pracy - data urodzenia" (series, number and name of ID document; for a job candidate also date of birth).
7. **zamieszkałego/zamieszkałą*)** `(miejscowość, ulica, nr domu, nr lokalu)` - residence address; gender-form strike.
8. **zatrudnionego/zatrudnioną*) lub podejmującego/podejmującą*) pracę na stanowisku lub stanowiskach pracy** - free-text line(s): employed in / taking up work at position(s). Strike employed vs. taking up.
9. **określenie stanowiska/stanowisk*) pracy*****)** - multi-line free text. Note `***)`: "Opisać: rodzaj pracy, podstawowe czynności, sposób i czas ich wykonywania" (describe type of work, basic tasks, how and for how long performed). Per § 4 ust. 2 pkt 2: for candidates/transferees the employer may list two or more positions "w kolejności odpowiadającej potrzebom zakładu" (in order of the employer's needs).
10. **Opis warunków pracy** ... (description of working conditions incl. hazardous/harmful/burdensome factors, with exposure magnitude and current measurement results from that position) - "należy wpisać nazwę czynnika/czynników i wielkość/wielkości narażenia****)". Five labelled free-text blocks:
    - I. Czynniki fizyczne
    - II. Pyły
    - III. Czynniki chemiczne
    - IV. Czynniki biologiczne
    - V. Inne czynniki, w tym niebezpieczne
11. **Łączna liczba czynników niebezpiecznych, szkodliwych dla zdrowia lub czynników uciążliwych i innych wynikających ze sposobu wykonywania pracy wskazanych w skierowaniu:** - total count of factors listed (number; employer-filled, derivable from block 10).
12. `(podpis pracodawcy)` - employer's signature.
13. Notes (objaśnienia) `****)`: the description must take into account regulations under Kodeks pracy art. 222 § 3 (carcinogens/mutagens), 222^1 § 3 (biological agents), 227 § 2 (tests/measurements), 228 § 3 (NDS/NDN limits), Prawo atomowe art. 25 pkt 1 (ionising radiation dose indicators), and Annex 1 to the same regulation (wskazówki metodyczne - the factor/frequency table). Closing note: the referral is issued in two copies, one for the examined person.

Not on the form: exam date, doctor/clinic, employer NIP/address as separate fields, employee position as coded value, job category. These are not part of the official wzór.

## Employee data required
Fields about the person being referred (what an employee/candidate record must supply):

| Field | PL label | Status | Note |
|---|---|---|---|
| Name | imię i nazwisko | required | Single field on form; store given name(s) + surname. |
| Gender form | Pana/Panią; zamieszkałego/zamieszkałą; zatrudnionego/zatrudnioną; podejmującego/podejmującą | required (derived) | Only grammatical strike-throughs; needs a sex/grammatical-gender field or user choice. |
| PESEL | nr PESEL | required if one was assigned | |
| ID document | seria, numer i nazwa dokumentu potwierdzającego tożsamość | conditional: only if no PESEL | |
| Date of birth | data urodzenia | conditional: only if no PESEL AND person is a job candidate | Per note `**)`. |
| Residence address | miejscowość, ulica, nr domu, nr lokalu | required | Four parts; flat number optional in practice (unverified). |
| Employment status | zatrudniony / podejmujący pracę | required | Derived: existing employee vs. candidate. |
| Position(s) | stanowisko/stanowiska pracy | required | One or several (several allowed for candidates/transfers, ordered). |
| Work description | rodzaj pracy, podstawowe czynności, sposób i czas wykonywania | required | Per position. |
| Working conditions | opis warunków pracy: factors + exposure values + latest measurements | required per position (may be "none"; see risk-factors.md) | Belongs to the position, not the person. |

Employer / referral-level fields (not employee data):

| Field | PL label | Status |
|---|---|---|
| Employer identification | oznaczenie pracodawcy | required (name + address; NIP common but unverified as mandated) |
| Place and date of issue | miejscowość, data | required |
| Employer signature | podpis pracodawcy | required (on paper; electronic form not specified in the annex) |
| Total number of factors | łączna liczba czynników ... | required, computed |
| Copies | two copies, one to the examined person | procedural (§ 4 ust. 1a) |

Exam-type field:

| Field | Values | Status |
|---|---|---|
| Rodzaj badania | wstępne / okresowe / kontrolne | required, exactly one (§ 4 ust. 2 pkt 1) |

Modelling hint: position + factor list + exposure values belong to a *stanowisko* entity owned by the company; the employee record only references position(s). Per the 2026 amendment the medical certificate (orzeczenie) cites the referral's date, so persist the issue date.
