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

If you have any questions, please contact the organizers at support@isir2026.org and quote your submission ID.

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

If you have any questions, please contact the organizers at support@isir2026.org and quote your submission ID.

Sincerely,
The ISIR 2026 Organizing Committee
```

---

## Notes

- Names, titles, categories, and IDs are filled from the abstract record at send time.
- HTML emails use Georgia/serif body text to match the acceptance letter style; the blocks above are plain-text equivalents for review.
- Implementation: `sendAbstractFormatSelectionEmail` in `src/worker.js`.
- Related: acceptance emails already say authors will get a separate notification if selected for oral presentation.

---

# Oral session speaker letters (N1–N6)

These are the emails admins send from **Admin → Sessions** after an oral abstract is placed in a session. Sending is manual. Recipients: presenting author and corresponding author (one email if they share an address).

N1 uses a different opening (Young Investigator Award Competition). Session title and date are filled from the assigned session.

---

## N2–N6 oral presentation

**Subject:** ISIR 2026 – Oral presentation, Session N2

```text
Dear Khaliun Dashdeleg and Joanne Kwak-Kim,

Congratulations! Your abstract, ABS-DEMO-001: IVF outcomes by the age-adjusted AMH ratio in women receiving immunomodulatory treatment versus untreated controls: a pilot two-center study, has been selected for oral presentation at the ISIR 2026 Congress, taking place November 5 - 8, 2026, in Busan, Korea.

The presenting author is expected to attend Congress in person to present the work. If the presenting author cannot attend, please identify a co-author to present on your behalf.

Below are the tentative details of the presentation:

Your presentation is scheduled as follows:
Title: IVF outcomes by the age-adjusted AMH ratio in women receiving immunomodulatory treatment versus untreated controls: a pilot two-center study
Session N2, New Research Findings. Pre-Conception, Fertility & Reproductive Disorders
Session Date: Friday, November 6, 2026, 4:05 PM – 5:00 PM

Important Notes and Guidelines:
At the meeting, on the date and time of your presentation above, you will give an 8-minute presentation of your abstract followed by 3 minutes of discussion. Total time of your presentation is 11 min. No virtual/pre-recorded presentation is allowed.

Withdrawal of Presentations/Failure to Present:
If it becomes necessary to withdraw your abstract, please have the presenting author email ISIR directly with this request at info@isir2026.org We encourage you to identify a named co-author on your abstract to present in your place before considering withdrawal.

Meeting Registration and Housing Reservations:
You must register yourself for the meeting. Online registration, hotel reservations, and the Preliminary Program are available at https://isir2026.org.

Once again, congratulations on this achievement. We look forward to seeing you in Busan!

The ISIR 2026 Organizing Committee
```

---

## N1 Young Investigator Award Competition

**Subject:** ISIR 2026 – Young Investigator Award Competition

Opening paragraph (the rest of the letter is the same, with N1 session lines):

```text
CONGRATULATIONS! Your abstract, ABS-DEMO-001: IVF outcomes by the age-adjusted AMH ratio…, has been selected for Young Investigator Award Competition at the ISIR 2026 Congress, taking place November 5 - 8, 2026, in Busan, Korea.
```

Session N1, Young Investigator Award competition.
Session Date: Friday, November 6, 2026, 4:05 PM – 5:06 PM

---

## Session catalog

| Session | Title | Date |
| --- | --- | --- |
| N1 | Young Investigator Award competition | Friday, November 6, 2026, 4:05 PM – 5:06 PM |
| N2 | New Research Findings. Pre-Conception, Fertility & Reproductive Disorders | Friday, November 6, 2026, 4:05 PM – 5:00 PM |
| N3 | New Research Findings. Early Pregnancy and Implantation | Friday, November 6, 2026, 4:05 PM – 5:00 PM |
| N4 | New Research Findings. Immune Regulation in Reproduction | Saturday, November 7, 2026, 4:05 PM – 5:06 PM |
| N5 | New Research Findings. Placental Development and Function | Saturday, November 7, 2026, 4:05 PM – 5:00 PM |
| N6 | New Research Findings. Maternal-Fetal Immunology & Gestational Complications | Saturday, November 7, 2026, 4:05 PM – 5:06 PM |

Implementation: `buildOralSessionLetter` in `src/config/oralSessions.js`, sent by `sendOralSessionLetterEmail` in `src/worker.js`. Requires `db/migration_add_oral_session.sql`.

---

# Poster session letters (#1 / #2)

Admins assign posters from **Admin → Sessions → Posters**. **Split unassigned equally at random** shuffles and divides them as evenly as possible between #1 and #2.

Official letter copy is not in yet. Placeholders mention Poster Session #1 vs #2 and leave session date TBA. Recipients: presenting and corresponding authors.

**Subject:** `ISIR 2026 – Poster Session #1` (or `#2`)

Requires `db/migration_add_poster_session.sql`. Implementation: `buildPosterSessionLetter` in `src/config/oralSessions.js`.
