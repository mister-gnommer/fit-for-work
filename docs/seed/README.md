# Seed data

- `risk-factors.json`: the 34 predefined risk factors (five categories, from `docs/research/risk-factors.md`), in the enum values from `docs/DATA-MODEL.md`.
- `demo.json`: one Telemedi user and three companies. *Przykładowa Logistyka* is the presentation company. It has 8 employees (one without a PESEL), custom risk factors, 2 templates and 5 referrals covering every status and exam type. The other two companies have only an admin, so the company switcher has something to switch between.
- All data is synthetic. Companies, people, addresses and ID numbers are invented. PESEL and NIP numbers pass the checksum but belong to no real person or company.
- Demo logins, all with the password `Demo123!haslo`:
  - Telemedi: `telemedi@example.com`
  - Przykładowa Logistyka: `admin.logistyka@example.com`, `operator1.logistyka@example.com`, `operator2.logistyka@example.com`
  - Demo Budowa: `admin.budowa@example.com`
  - Przykładowe Usługi Rolnicze: `admin.rolnicze@example.com`
- Validation passed: every PESEL and NIP checksum, PESEL sex digit and birth date, enum values, template references and referral indexes were checked by script.
