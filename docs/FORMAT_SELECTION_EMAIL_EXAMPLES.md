# Oral / poster selection email examples

These are the emails admins send from **Admin → Oral / Poster assignment** after an accepted abstract is assigned `oral` or `poster`. Sending is manual (not automatic on assign).

Recipient: corresponding author email, falling back to presenter email.

---

## Oral selection

**Subject:** ISIR 2026 – Selected for oral presentation

```text
Dear Joanne Kwak-Kim,

On behalf of the organizing committee, we are pleased to inform you that your abstract has been selected for an oral presentation at the ISIR 2026 Congress in Busan, Korea (November 5th–8th, 2026).

Further details regarding your session time and presentation guidelines will be shared closer to the meeting.

Submission details
------------------
Submission ID:  ABS-DEMO-001
Title:          IVF outcomes by the age-adjusted AMH ratio in women receiving immunomodulatory treatment versus untreated controls: a pilot two-center study
Category:       ART and Fertility Treatment
Format:         oral presentation

If you have any questions, please contact the organizers at support@theisir.org and quote your submission ID.

Sincerely,
The ISIR 2026 Organizing Committee
```

---

## Poster assignment

**Subject:** ISIR 2026 – Assigned as poster presentation

```text
Dear Yohan Choi,

On behalf of the organizing committee, this letter confirms that your accepted abstract has been assigned as a poster presentation at the ISIR 2026 Congress in Busan, Korea (November 5th–8th, 2026).

Further details regarding poster display and presentation guidelines will be shared closer to the meeting.

Submission details
------------------
Submission ID:  ABS-DEMO-002
Title:          A Single-Cell Map of the Aging Human Periovulatory Follicle
Category:       Novel Technologies and Methods
Format:         poster presentation

If you have any questions, please contact the organizers at support@theisir.org and quote your submission ID.

Sincerely,
The ISIR 2026 Organizing Committee
```

---

## Notes

- Names, titles, categories, and IDs are filled from the abstract record at send time.
- HTML emails use Georgia/serif body text to match the acceptance letter style; the blocks above are plain-text equivalents for review.
- Implementation: `sendAbstractFormatSelectionEmail` in `src/worker.js`.
- Related: acceptance emails already say authors will get a separate notification if selected for oral presentation.
