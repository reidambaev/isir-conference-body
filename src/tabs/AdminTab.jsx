import React, { useState, useEffect } from "react";

export default function AdminTab() {
  const [abstracts, setAbstracts] = useState([]);
  const [visaRequests, setVisaRequests] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("abstracts");
  const [error, setError] = useState(null);
  const [expandedAbstracts, setExpandedAbstracts] = useState(new Set());

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Fake abstract submissions data
      const fakeAbstracts = [
        {
          id: "ABS-1738000000-ABC123DEF",
          submission_date: Date.now() - 86400000 * 5, // 5 days ago
          title: "Neural Mechanisms of Interoceptive Awareness in Anxiety Disorders",
          category: "Clinical Research",
          keywords: "anxiety, interoception, fMRI, neural networks",
          abstract: "This study investigates the neural mechanisms underlying interoceptive awareness in individuals with anxiety disorders. Using functional magnetic resonance imaging (fMRI), we examined brain activity patterns in 45 participants with generalized anxiety disorder and 30 healthy controls during an interoceptive attention task. Our findings reveal significant differences in activation within the anterior insula and anterior cingulate cortex, suggesting altered interoceptive processing in anxiety. These results contribute to our understanding of the neurobiological basis of anxiety and may inform future therapeutic interventions targeting interoceptive awareness.",
          word_count: 98,
          presentation_preference: "oral",
          presenter_name: "Dr. Sarah Chen",
          presenter_email: "sarah.chen@university.edu",
          corresponding_name: "Dr. Sarah Chen",
          corresponding_email: "sarah.chen@university.edu",
          corresponding_author_id: "AUTH-1738000000-ABC123DEF-0",
          status: "submitted",
          authors: [
            {
              id: "AUTH-1738000000-ABC123DEF-0",
              abstract_id: "ABS-1738000000-ABC123DEF",
              first_name: "Sarah",
              middle_name: null,
              last_name: "Chen",
              email: "sarah.chen@university.edu",
              is_presenter: 1,
              is_corresponding: 1,
              position: 0,
            },
            {
              id: "AUTH-1738000000-ABC123DEF-1",
              abstract_id: "ABS-1738000000-ABC123DEF",
              first_name: "Michael",
              middle_name: "James",
              last_name: "Rodriguez",
              email: "m.rodriguez@university.edu",
              is_presenter: 0,
              is_corresponding: 0,
              position: 1,
            },
            {
              id: "AUTH-1738000000-ABC123DEF-2",
              abstract_id: "ABS-1738000000-ABC123DEF",
              first_name: "Emily",
              middle_name: null,
              last_name: "Watson",
              email: "e.watson@research.org",
              is_presenter: 0,
              is_corresponding: 0,
              position: 2,
            },
          ],
          affiliations: [
            {
              id: "AFF-1738000000-ABC123DEF-0",
              abstract_id: "ABS-1738000000-ABC123DEF",
              author_name: "Sarah Chen",
              department: "Department of Psychology",
              institution: "University of California",
              city: "Los Angeles",
              country: "United States",
              position: 0,
            },
            {
              id: "AFF-1738000000-ABC123DEF-1",
              abstract_id: "ABS-1738000000-ABC123DEF",
              author_name: "Michael Rodriguez",
              department: "Neuroscience Research Center",
              institution: "University of California",
              city: "Los Angeles",
              country: "United States",
              position: 1,
            },
            {
              id: "AFF-1738000000-ABC123DEF-2",
              abstract_id: "ABS-1738000000-ABC123DEF",
              author_name: "Emily Watson",
              department: "Clinical Research Division",
              institution: "National Institute of Mental Health",
              city: "Bethesda",
              country: "United States",
              position: 2,
            },
          ],
        },
        {
          id: "ABS-1738000000-XYZ789GHI",
          submission_date: Date.now() - 86400000 * 3, // 3 days ago
          title: "The Role of Mindfulness-Based Interventions in Reducing Stress Response",
          category: "Intervention Studies",
          keywords: "mindfulness, stress, cortisol, intervention",
          abstract: "This randomized controlled trial examines the efficacy of an 8-week mindfulness-based stress reduction (MBSR) program in reducing physiological and psychological stress responses. Sixty participants were randomly assigned to either the MBSR intervention group or a waitlist control group. Salivary cortisol levels, self-reported stress measures, and heart rate variability were assessed at baseline, post-intervention, and 3-month follow-up. Results indicate significant reductions in cortisol levels and self-reported stress in the intervention group compared to controls, with effects maintained at follow-up. These findings support the use of mindfulness-based interventions as effective tools for stress management.",
          word_count: 125,
          presentation_preference: "either",
          presenter_name: "Dr. James Park",
          presenter_email: "j.park@korea.ac.kr",
          corresponding_name: "Dr. James Park",
          corresponding_email: "j.park@korea.ac.kr",
          corresponding_author_id: "AUTH-1738000000-XYZ789GHI-0",
          status: "submitted",
          authors: [
            {
              id: "AUTH-1738000000-XYZ789GHI-0",
              abstract_id: "ABS-1738000000-XYZ789GHI",
              first_name: "James",
              middle_name: null,
              last_name: "Park",
              email: "j.park@korea.ac.kr",
              is_presenter: 1,
              is_corresponding: 1,
              position: 0,
            },
            {
              id: "AUTH-1738000000-XYZ789GHI-1",
              abstract_id: "ABS-1738000000-XYZ789GHI",
              first_name: "Min-Jung",
              middle_name: null,
              last_name: "Kim",
              email: "mj.kim@korea.ac.kr",
              is_presenter: 0,
              is_corresponding: 0,
              position: 1,
            },
          ],
          affiliations: [
            {
              id: "AFF-1738000000-XYZ789GHI-0",
              abstract_id: "ABS-1738000000-XYZ789GHI",
              author_name: "James Park",
              department: "Department of Psychology",
              institution: "Seoul National University",
              city: "Seoul",
              country: "South Korea",
              position: 0,
            },
            {
              id: "AFF-1738000000-XYZ789GHI-1",
              abstract_id: "ABS-1738000000-XYZ789GHI",
              author_name: "Min-Jung Kim",
              department: "Department of Psychology",
              institution: "Seoul National University",
              city: "Seoul",
              country: "South Korea",
              position: 1,
            },
          ],
        },
        {
          id: "ABS-1738000000-MNO456PQR",
          submission_date: Date.now() - 86400000 * 1, // 1 day ago
          title: "Cross-Cultural Differences in Emotional Regulation Strategies",
          category: "Social Psychology",
          keywords: "emotion regulation, cross-cultural, cultural psychology",
          abstract: "This cross-cultural study explores differences in emotional regulation strategies between Eastern and Western populations. We surveyed 200 participants from Japan, South Korea, the United States, and Germany using standardized measures of emotion regulation. Our findings reveal significant cultural variations in the preference for cognitive reappraisal versus expressive suppression, with Eastern participants showing greater use of suppression strategies. These results highlight the importance of cultural context in understanding emotional processes and have implications for culturally sensitive psychological interventions.",
          word_count: 112,
          presentation_preference: "poster",
          presenter_name: "Dr. Yuki Tanaka",
          presenter_email: "y.tanaka@tokyo-u.ac.jp",
          corresponding_name: "Dr. Yuki Tanaka",
          corresponding_email: "y.tanaka@tokyo-u.ac.jp",
          corresponding_author_id: "AUTH-1738000000-MNO456PQR-0",
          status: "submitted",
          authors: [
            {
              id: "AUTH-1738000000-MNO456PQR-0",
              abstract_id: "ABS-1738000000-MNO456PQR",
              first_name: "Yuki",
              middle_name: null,
              last_name: "Tanaka",
              email: "y.tanaka@tokyo-u.ac.jp",
              is_presenter: 1,
              is_corresponding: 1,
              position: 0,
            },
            {
              id: "AUTH-1738000000-MNO456PQR-1",
              abstract_id: "ABS-1738000000-MNO456PQR",
              first_name: "Thomas",
              middle_name: "Robert",
              last_name: "Schmidt",
              email: "t.schmidt@berlin-uni.de",
              is_presenter: 0,
              is_corresponding: 0,
              position: 1,
            },
          ],
          affiliations: [
            {
              id: "AFF-1738000000-MNO456PQR-0",
              abstract_id: "ABS-1738000000-MNO456PQR",
              author_name: "Yuki Tanaka",
              department: "Department of Psychology",
              institution: "University of Tokyo",
              city: "Tokyo",
              country: "Japan",
              position: 0,
            },
            {
              id: "AFF-1738000000-MNO456PQR-1",
              abstract_id: "ABS-1738000000-MNO456PQR",
              author_name: "Thomas Schmidt",
              department: "Institute of Psychology",
              institution: "Humboldt University",
              city: "Berlin",
              country: "Germany",
              position: 1,
            },
          ],
        },
      ];

      // Fake visa requests data
      const fakeVisaRequests = [
        {
          id: "visa-001",
          email: "sarah.chen@university.edu",
          name: "Sarah Chen",
          country: "United States",
          notes: "Need visa invitation letter for conference attendance. Planning to arrive on August 15, 2026.",
          status: "pending",
          created_at: Date.now() - 86400000 * 10,
          updated_at: Date.now() - 86400000 * 10,
        },
        {
          id: "visa-002",
          email: "j.park@korea.ac.kr",
          name: "James Park",
          country: "South Korea",
          notes: "Already have valid visa, just need confirmation letter",
          status: "approved",
          created_at: Date.now() - 86400000 * 8,
          updated_at: Date.now() - 86400000 * 7,
        },
        {
          id: "visa-003",
          email: "y.tanaka@tokyo-u.ac.jp",
          name: "Yuki Tanaka",
          country: "Japan",
          notes: "Requesting visa support letter for South Korea entry",
          status: "pending",
          created_at: Date.now() - 86400000 * 5,
          updated_at: Date.now() - 86400000 * 5,
        },
        {
          id: "visa-004",
          email: "m.rodriguez@university.edu",
          name: "Michael Rodriguez",
          country: "Mexico",
          notes: "Need urgent visa processing, conference starts soon",
          status: "pending",
          created_at: Date.now() - 86400000 * 2,
          updated_at: Date.now() - 86400000 * 2,
        },
        {
          id: "visa-005",
          email: "t.schmidt@berlin-uni.de",
          name: "Thomas Schmidt",
          country: "Germany",
          notes: null,
          status: "approved",
          created_at: Date.now() - 86400000 * 12,
          updated_at: Date.now() - 86400000 * 11,
        },
      ];

      // Fake registrations data
      const fakeRegistrations = [
        {
          id: "REG-1738000000-ABC123",
          registration_date: Date.now() - 86400000 * 15,
          email: "sarah.chen@university.edu",
          first_name: "Sarah",
          middle_name: null,
          last_name: "Chen",
          institution: "University of California",
          ticket_type: "isir-member",
          total_price: 350,
          payment_status: "paid",
        },
        {
          id: "REG-1738000000-XYZ789",
          registration_date: Date.now() - 86400000 * 12,
          email: "j.park@korea.ac.kr",
          first_name: "James",
          middle_name: null,
          last_name: "Park",
          institution: "Seoul National University",
          ticket_type: "isir-member",
          total_price: 350,
          payment_status: "paid",
        },
        {
          id: "REG-1738000000-MNO456",
          registration_date: Date.now() - 86400000 * 10,
          email: "y.tanaka@tokyo-u.ac.jp",
          first_name: "Yuki",
          middle_name: null,
          last_name: "Tanaka",
          institution: "University of Tokyo",
          ticket_type: "non-member",
          total_price: 650,
          payment_status: "pending",
        },
        {
          id: "REG-1738000000-DEF321",
          registration_date: Date.now() - 86400000 * 8,
          email: "m.rodriguez@university.edu",
          first_name: "Michael",
          middle_name: "James",
          last_name: "Rodriguez",
          institution: "University of California",
          ticket_type: "trainee-member",
          total_price: 150,
          payment_status: "paid",
        },
        {
          id: "REG-1738000000-GHI654",
          registration_date: Date.now() - 86400000 * 6,
          email: "t.schmidt@berlin-uni.de",
          first_name: "Thomas",
          middle_name: "Robert",
          last_name: "Schmidt",
          institution: "Humboldt University",
          ticket_type: "non-member",
          total_price: 750,
          payment_status: "pending",
        },
        {
          id: "REG-1738000000-JKL987",
          registration_date: Date.now() - 86400000 * 4,
          email: "e.watson@research.org",
          first_name: "Emily",
          middle_name: null,
          last_name: "Watson",
          institution: "National Institute of Mental Health",
          ticket_type: "isir-member",
          total_price: 450,
          payment_status: "paid",
        },
        {
          id: "REG-1738000000-PQR234",
          registration_date: Date.now() - 86400000 * 2,
          email: "mj.kim@korea.ac.kr",
          first_name: "Min-Jung",
          middle_name: null,
          last_name: "Kim",
          institution: "Seoul National University",
          ticket_type: "trainee-non-member",
          total_price: 250,
          payment_status: "pending",
        },
      ];

      setAbstracts(fakeAbstracts);
      setVisaRequests(fakeVisaRequests);
      setRegistrations(fakeRegistrations);
    } catch (err) {
      console.error("Error loading fake data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const toggleAbstract = (abstractId) => {
    setExpandedAbstracts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(abstractId)) {
        newSet.delete(abstractId);
      } else {
        newSet.add(abstractId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">Loading admin data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage abstract submissions, visa requests, and registrations
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveSection("abstracts")}
          className={`px-4 py-2 font-medium ${
            activeSection === "abstracts"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Abstract Submissions ({abstracts.length})
        </button>
        <button
          onClick={() => setActiveSection("visa")}
          className={`px-4 py-2 font-medium ${
            activeSection === "visa"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Visa Requests ({visaRequests.length})
        </button>
        <button
          onClick={() => setActiveSection("registrations")}
          className={`px-4 py-2 font-medium ${
            activeSection === "registrations"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Registrations ({registrations.length})
        </button>
      </div>

      {/* Abstract Submissions Section */}
      {activeSection === "abstracts" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Abstract Submissions
          </h2>
          {abstracts.length === 0 ? (
            <p className="text-gray-500">No abstract submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {abstracts.map((abstract) => {
                const isExpanded = expandedAbstracts.has(abstract.id);
                return (
                  <div
                    key={abstract.id}
                    className="border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {/* Collapsed Header - Always Visible */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleAbstract(abstract.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {abstract.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {abstract.category}
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                              {abstract.presentation_preference}
                            </span>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              Status: {abstract.status}
                            </span>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              {abstract.word_count} words
                            </span>
                            <span className="text-gray-500 text-xs">
                              {formatDate(abstract.submission_date)}
                            </span>
                          </div>
                        </div>
                        <button
                          className="ml-4 text-gray-500 hover:text-gray-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAbstract(abstract.id);
                          }}
                        >
                          {isExpanded ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content - Conditionally Rendered */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-200 space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">
                            Abstract:
                          </h4>
                          <p className="text-gray-600 whitespace-pre-wrap">
                            {abstract.abstract}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">
                            Keywords:
                          </h4>
                          <p className="text-gray-600">{abstract.keywords}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">
                            Authors:
                          </h4>
                          <div className="space-y-2">
                            {abstract.authors?.map((author) => (
                              <div
                                key={author.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span className="font-medium text-gray-700">
                                  {author.first_name}
                                  {author.middle_name ? ` ${author.middle_name}` : ""}{" "}
                                  {author.last_name}
                                </span>
                                {author.email && (
                                  <span className="text-gray-500">({author.email})</span>
                                )}
                                {author.is_presenter === 1 && (
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
                                    Presenter
                                  </span>
                                )}
                                {author.is_corresponding === 1 && (
                                  <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs">
                                    Corresponding
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">
                            Affiliations:
                          </h4>
                          <div className="space-y-2">
                            {abstract.affiliations?.map((aff) => (
                              <div
                                key={aff.id}
                                className="text-sm text-gray-600 bg-white p-2 rounded border"
                              >
                                <span className="font-medium">{aff.author_name}</span>
                                {aff.department && (
                                  <span> - {aff.department}</span>
                                )}
                                {aff.institution && (
                                  <span>, {aff.institution}</span>
                                )}
                                {aff.city && aff.country && (
                                  <span> - {aff.city}, {aff.country}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Presenter:</span>{" "}
                            {abstract.presenter_name} ({abstract.presenter_email})
                          </p>
                          <p>
                            <span className="font-medium">Corresponding Author:</span>{" "}
                            {abstract.corresponding_name} ({abstract.corresponding_email})
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Visa Requests Section */}
      {activeSection === "visa" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Visa Requests
          </h2>
          {visaRequests.length === 0 ? (
            <p className="text-gray-500">No visa requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visaRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : request.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {request.notes || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Registrations Section */}
      {activeSection === "registrations" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Registrations
          </h2>
          {registrations.length === 0 ? (
            <p className="text-gray-500">No registrations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Institution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.map((reg) => (
                    <tr key={reg.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {reg.first_name} {reg.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {reg.institution || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.ticket_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${reg.total_price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reg.payment_status === "paid"
                              ? "bg-green-100 text-green-800"
                              : reg.payment_status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {reg.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(reg.registration_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
}
