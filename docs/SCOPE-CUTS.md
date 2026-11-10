# Scope cuts

These are things we've deliberately left out. They aren't postponed (that's the Deferred list in `README.md`). They're out of this project unless we decide otherwise.

- **GDPR/RODO compliance.** That includes the legal basis and consent, data subject requests (access, export, erasure), retention periods, a DPIA, and logging access to health data. The app stores health-related personal data, so a production version would need all of this.
- **Encryption beyond what the infrastructure provides.** We treat the infrastructure as trusted.
- **Emails and notifications** of any kind.
- **Mobile and tablet layouts.** Desktop only.
- **Languages other than Polish.**
- **Rules for status changes.** Telemedi picks any status from a dropdown. Proper transition rules will come with the Telemedi API integration.
- **Self-service password reset.** Whoever created the account resets the password.
- **Cross-company views for Telemedi**, like "all referrals due this week". Telemedi works one company at a time through the switcher.
- **Electronic signatures** (qualified e-signature, ePUAP). The PDF is signed by hand.
- **The medical side**: exam results, the medical certificate (*orzeczenie*), booking appointments, and integration with Telemedi's or insurers' systems.
- **Scaling and high availability.** One container with SQLite.
- **Formal accessibility audit.** We rely on shadcn/ui's accessible defaults.
- **Retention and archiving** of old referrals.
