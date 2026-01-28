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
      const [abstractsRes, visaRes, registrationsRes] = await Promise.all([
        fetch("/api/admin/abstracts"),
        fetch("/api/admin/visa-requests"),
        fetch("/api/registrations"),
      ]);

      if (!abstractsRes.ok || !visaRes.ok || !registrationsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const abstractsData = await abstractsRes.json();
      const visaData = await visaRes.json();
      const registrationsData = await registrationsRes.json();

      setAbstracts(abstractsData.data || []);
      setVisaRequests(visaData.data || []);
      setRegistrations(registrationsData.data || []);
    } catch (err) {
      console.error("Error fetching admin data:", err);
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
