/** Sample admin dashboard data for localhost browsing without cloud/API access. */

export const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export function isAdminLocalhost() {
  return (
    typeof window !== "undefined" &&
    LOCALHOST_NAMES.has(window.location.hostname)
  );
}

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

function mealDays(...days) {
  return JSON.stringify(days);
}

/**
 * Returns a full set of in-memory fixtures for AdminTab sections.
 * Shapes mirror what the live admin APIs return.
 */
export function buildLocalAdminDemoData() {
  const abstracts = [
    {
      id: "ABS-DEMO-001",
      title: "Ovarian aging biomarkers in assisted reproduction",
      category: "Clinical Studies",
      abstract_submission_type: "Clinical Research",
      status: "submitted",
      keywords: "AMH, IVF, ovarian reserve",
      abstract_text:
        "This demo abstract summarizes a multi-center study of ovarian aging biomarkers and their association with IVF outcomes. (Localhost sample data — not a real submission.)",
      submission_date: now - 5 * day,
      is_invited_speaker: 0,
      presenter_name: "Alex Rivera",
      presenter_email: "alex.rivera@example.com",
      presenter_author_id: "AUTH-1",
      corresponding_author_id: "AUTH-1",
      authors: [
        {
          id: "AUTH-1",
          first_name: "Alex",
          last_name: "Rivera",
          email: "alex.rivera@example.com",
          position: 0,
          is_presenter: 1,
          is_corresponding: 1,
        },
        {
          id: "AUTH-2",
          first_name: "Jordan",
          last_name: "Lee",
          email: "jordan.lee@example.com",
          position: 1,
          is_presenter: 0,
          is_corresponding: 0,
        },
      ],
      affiliations: [
        {
          id: "AFF-1",
          author_name: "Alex Rivera",
          department: "Reproductive Medicine",
          institution: "Demo University Hospital",
          city: "Seoul",
          country: "Korea, Republic of",
        },
      ],
    },
    {
      id: "ABS-DEMO-002",
      title: "Mitochondrial dynamics in oocyte maturation",
      category: "Basic Studies",
      abstract_submission_type: "Basic Research",
      status: "accepted",
      keywords: "mitochondria, oocyte, maturation",
      abstract_text:
        "Demo basic-science abstract on mitochondrial dynamics during oocyte maturation. Localhost sample only.",
      submission_date: now - 12 * day,
      is_invited_speaker: 0,
      presenter_name: "Sam Chen",
      presenter_email: "sam.chen@example.com",
      presenter_author_id: "AUTH-3",
      corresponding_author_id: "AUTH-3",
      authors: [
        {
          id: "AUTH-3",
          first_name: "Sam",
          last_name: "Chen",
          email: "sam.chen@example.com",
          position: 0,
          is_presenter: 1,
          is_corresponding: 1,
        },
      ],
      affiliations: [
        {
          id: "AFF-2",
          author_name: "Sam Chen",
          department: "Cell Biology",
          institution: "Example Research Institute",
          city: "Boston",
          country: "United States",
        },
      ],
    },
    {
      id: "ABS-DEMO-INV-001",
      title: "Keynote: Global fertility trends and policy",
      category: "Clinical Studies",
      abstract_submission_type: "Clinical Research",
      status: "accepted",
      keywords: "demographics, policy, fertility",
      abstract_text:
        "Invited speaker demo abstract for localhost admin browsing.",
      submission_date: now - 20 * day,
      is_invited_speaker: 1,
      presenter_name: "Dr. Mina Park",
      presenter_email: "mina.park@example.com",
      presenter_author_id: "AUTH-4",
      corresponding_author_id: "AUTH-4",
      authors: [
        {
          id: "AUTH-4",
          first_name: "Mina",
          last_name: "Park",
          email: "mina.park@example.com",
          position: 0,
          is_presenter: 1,
          is_corresponding: 1,
        },
      ],
      affiliations: [
        {
          id: "AFF-3",
          author_name: "Mina Park",
          department: "Obstetrics & Gynecology",
          institution: "National Demo Medical Center",
          city: "Seoul",
          country: "Korea, Republic of",
        },
      ],
    },
  ];

  const registrations = [
    {
      id: "REG-DEMO-001",
      first_name: "Taylor",
      middle_name: null,
      last_name: "Kim",
      email: "taylor.kim@example.com",
      institution: "Seoul Demo Hospital",
      badge_name: "Taylor Kim",
      ticket_type: "isir-member",
      payment_status: "completed",
      total_price: 650,
      accompanying_count: 1,
      is_invited_speaker: 0,
      opening_reception_attending: 1,
      gala_dinner_attending: 1,
      lunch_days: mealDays("Friday", "Saturday"),
      breakfast_days: mealDays("Saturday", "Sunday"),
      city: "Seoul",
      country: "Korea, Republic of",
      phone: "+82-10-0000-0001",
      cell_phone: null,
      trainee_letter_status: "not_required",
      registration_date: now - 8 * day,
    },
    {
      id: "REG-DEMO-002",
      first_name: "Casey",
      last_name: "Nguyen",
      email: "casey.nguyen@example.com",
      institution: "Pacific Fertility Clinic",
      badge_name: "Casey Nguyen",
      ticket_type: "non-member",
      payment_status: "completed",
      total_price: 850,
      accompanying_count: 0,
      is_invited_speaker: 0,
      opening_reception_attending: 1,
      gala_dinner_attending: 0,
      lunch_days: mealDays("Friday", "Saturday", "Sunday"),
      breakfast_days: mealDays("Friday", "Saturday"),
      city: "San Francisco",
      country: "United States",
      phone: "+1-415-555-0102",
      trainee_letter_status: "not_required",
      registration_date: now - 6 * day,
    },
    {
      id: "REG-DEMO-003",
      first_name: "Riley",
      last_name: "Patel",
      email: "riley.patel@example.com",
      institution: "Demo Medical School",
      badge_name: "Riley Patel",
      ticket_type: "trainee-member",
      payment_status: "pending",
      total_price: 350,
      accompanying_count: 0,
      is_invited_speaker: 0,
      opening_reception_attending: 1,
      gala_dinner_attending: 0,
      lunch_days: mealDays("Saturday"),
      breakfast_days: mealDays("Saturday"),
      city: "London",
      country: "United Kingdom",
      phone: "+44-20-7946-0103",
      trainee_letter_url: "trainee-letters/demo.pdf",
      trainee_letter_status: "pending",
      registration_date: now - 3 * day,
    },
    {
      id: "REG-DEMO-004",
      first_name: "Mina",
      last_name: "Park",
      email: "mina.park@example.com",
      institution: "National Demo Medical Center",
      badge_name: "Mina Park",
      ticket_type: "invited-speaker",
      payment_status: "completed",
      total_price: 0,
      accompanying_count: 1,
      is_invited_speaker: 1,
      opening_reception_attending: 1,
      gala_dinner_attending: 1,
      lunch_days: mealDays("Friday", "Saturday", "Sunday"),
      breakfast_days: mealDays("Friday", "Saturday", "Sunday"),
      city: "Seoul",
      country: "Korea, Republic of",
      phone: "+82-10-0000-0004",
      trainee_letter_status: "not_required",
      registration_date: now - 15 * day,
    },
    {
      id: "REG-DEMO-005",
      first_name: "Jamie",
      last_name: "Okafor",
      email: "jamie.okafor@example.com",
      institution: "Lagos Research Center",
      badge_name: "Jamie Okafor",
      ticket_type: "trainee-non-member",
      payment_status: "completed",
      total_price: 400,
      accompanying_count: 0,
      is_invited_speaker: 0,
      opening_reception_attending: 0,
      gala_dinner_attending: 1,
      lunch_days: mealDays("Sunday"),
      breakfast_days: mealDays("Sunday"),
      city: "Lagos",
      country: "Nigeria",
      phone: "+234-800-000-0105",
      trainee_letter_url: "trainee-letters/demo2.pdf",
      trainee_letter_status: "accepted",
      registration_date: now - 4 * day,
    },
    {
      id: "REG-DEMO-006",
      first_name: "Quinn",
      last_name: "Sato",
      email: "quinn.sato@example.com",
      institution: "Tokyo Day Clinic",
      badge_name: "Quinn Sato",
      ticket_type: "korea-day-pass",
      payment_status: "failed",
      total_price: 150,
      accompanying_count: 0,
      is_invited_speaker: 0,
      opening_reception_attending: 0,
      gala_dinner_attending: 0,
      lunch_days: mealDays("Saturday"),
      breakfast_days: mealDays(),
      day_pass_days: mealDays("Saturday"),
      city: "Tokyo",
      country: "Japan",
      phone: "+81-3-0000-0106",
      trainee_letter_status: "not_required",
      registration_date: now - 2 * day,
    },
  ];

  const visaRequests = [
    {
      id: "VISA-DEMO-001",
      name: "Casey Nguyen",
      affiliation: "Pacific Fertility Clinic",
      country: "United States",
      email: "casey.nguyen@example.com",
      status: "pending",
      registration_proof_r2_key: null,
      registration_proof_filename: null,
      notes: "",
      created_at: now - 5 * day,
    },
    {
      id: "VISA-DEMO-002",
      name: "Mina Park",
      affiliation: "National Demo Medical Center",
      country: "Korea, Republic of",
      email: "mina.park@example.com",
      status: "approved",
      registration_proof_r2_key: null,
      notes: "Invited speaker/chair — proof not required",
      created_at: now - 14 * day,
    },
  ];

  const speakerHotelRegistrations = [
    {
      id: "HOTEL-DEMO-001",
      invited_speaker_email: "mina.park@example.com",
      passport_name: "PARK, Mina",
      nationality: "Korea, Republic of",
      guest_count: 1,
      arrival_date: "2026-11-05",
      departure_date: "2026-11-09",
      phone: "+82-10-0000-0004",
      address_physical: "123 Demo Street, Seoul",
      updated_at: now - 10 * day,
    },
  ];

  const reviewerOverview = {
    abstracts_per_reviewer: 5,
    totals: {
      total_reviews: 4,
      total_assignments: 8,
      abstracts_with_reviews: 2,
    },
    reviewers: [
      {
        email: "reviewer.one@example.com",
        assigned_count: 5,
        reviewed_count: 5,
        avg_score: 7.4,
      },
      {
        email: "reviewer.two@example.com",
        assigned_count: 3,
        reviewed_count: 1,
        avg_score: 6.8,
      },
    ],
  };

  const reviewerAccounts = [
    {
      email: "reviewer.one@example.com",
      target_abstracts: 5,
      active: 1,
    },
    {
      email: "reviewer.two@example.com",
      target_abstracts: null,
      active: 1,
    },
  ];

  const reviewerAbstractScores = [
    {
      id: "ABS-DEMO-001",
      title: abstracts[0].title,
      category: abstracts[0].category,
      status: abstracts[0].status,
      review_summary: {
        review_count: 2,
        avg_total: 7.25,
        avg_novelty: 7.0,
        avg_significance: 7.5,
        avg_methods: 7.0,
        avg_clarity: 7.5,
      },
      reviews: [
        {
          reviewer_email: "reviewer.one@example.com",
          total_score: 7.5,
          notes: "Solid clinical design. Demo note only.",
          conflict_of_interest: 0,
        },
        {
          reviewer_email: "reviewer.two@example.com",
          total_score: 7.0,
          notes: "Minor clarity issues in methods.",
          conflict_of_interest: 0,
        },
      ],
    },
    {
      id: "ABS-DEMO-002",
      title: abstracts[1].title,
      category: abstracts[1].category,
      status: abstracts[1].status,
      review_summary: {
        review_count: 1,
        avg_total: 8.0,
        avg_novelty: 8.5,
        avg_significance: 8.0,
        avg_methods: 7.5,
        avg_clarity: 8.0,
      },
      reviews: [
        {
          reviewer_email: "reviewer.one@example.com",
          total_score: 8.0,
          notes: "Strong basic science contribution.",
          conflict_of_interest: 0,
        },
      ],
    },
  ];

  const speakerProfileSubmissions = [
    {
      id: "PROFILE-DEMO-001",
      status: "pending",
      speaker_key: null,
      display_name: "Dr. Mina Park",
      affiliation: "National Demo Medical Center",
      email: "mina.park@example.com",
      presentation_title: "Global fertility trends and policy",
      image_position: "center top",
      r2_key: null,
      cv_r2_key: null,
    },
    {
      id: "PROFILE-DEMO-002",
      status: "approved",
      speaker_key: "park-mina",
      display_name: "Alex Rivera",
      affiliation: "Demo University Hospital",
      email: "alex.rivera@example.com",
      presentation_title: "Workshop: biomarkers in ART",
      r2_key: null,
      cv_r2_key: null,
    },
  ];

  return {
    abstracts,
    registrations,
    visaRequests,
    speakerHotelRegistrations,
    reviewerOverview,
    reviewerAccounts,
    reviewerAccountsDefault: 5,
    reviewerAbstractScores,
    speakerProfileSubmissions,
  };
}
