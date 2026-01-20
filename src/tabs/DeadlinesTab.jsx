import React from "react";

// Deadlines data
const deadlines = [
  {
    date: "Feb 1",
    title: "Registration & Abstract Submissions Open",
    desc: "The portal for both congress registration and abstract submission will be available.",
    actions: [
      { label: "Register Now", tab: "registration" },
      { label: "Submit Abstract", tab: "submission" },
    ],
  },
  {
    date: "Apr 30",
    title: "Abstract Submission Deadline",
    desc: "Final day to submit abstracts for consideration.",
    actions: [{ label: "Submit Abstract", tab: "submission" }],
  },
  {
    date: "May 20",
    title: "Notification of Acceptance",
    desc: "Authors will be notified of their abstract status.",
  },
  {
    date: "Jul 10",
    title: "Early Bird Registration Closes",
    desc: "Register by this date to secure the discounted rate. Presenting authors must be registered.",
    isUrgent: true,
    actions: [{ label: "Register Now", tab: "registration" }],
  },
  {
    date: "Jul 10",
    title: "Hotel Discount Deadline",
    desc: "Last day to book hotel rooms at the early discounted rate.",
  },
  {
    date: "Aug 30",
    title: "Registration Deadline",
    desc: "Final day for advance registration. On-site registration available September 10-13.",
    actions: [{ label: "Register Now", tab: "registration" }],
  },
];

const DeadlinesTab = ({ onTabChange }) => {
  // --- Date Processing Logic ---

  // 1. Get today's date, normalized to midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. Set the conference year to 2026
  let eventYear = 2026;

  // 3. Process deadlines to add full dates and past/future status
  const processedDeadlines = deadlines.map((item) => {
    // Create a date object (e.g., 'Jan 15' -> Jan 15, 2026)
    const deadlineDate = new Date(item.date + ", " + eventYear);

    // 4. Check if the deadline is in the past
    const isPast = deadlineDate < today;

    return { ...item, fullDate: deadlineDate, isPast };
  });

  // 5. Find the index of the *first* deadline that is NOT in the past
  const closestIndex = processedDeadlines.findIndex((d) => !d.isPast);
  // --- End of Logic ---

  return (
    <div role="tabpanel" className="py-4">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              Important Dates & Deadlines
            </h3>
            <p className="text-gray-600">
              Mark your calendar for these key milestones
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[39px] top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 rounded-full hidden md:block"></div>

        <div className="space-y-6">
          {processedDeadlines.map((item, index) => {
            const [month, day] = item.date.split(" ");

            const isClosest = closestIndex === index;
            const isPast = item.isPast;

            // The "Housing" deadline's isUrgent flag is respected *unless*
            // another item is closer. The closest non-past item is *always* urgent.
            const isUrgent = (item.isUrgent && !isPast) || isClosest;

            // Icon based on status
            const getIcon = () => {
              if (isPast) {
                return (
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                );
              } else if (isUrgent) {
                return (
                  <svg
                    className="w-5 h-5 text-red-500 animate-pulse"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                );
              } else {
                return (
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                );
              }
            };

            return (
              <div
                key={item.title + index}
                className={`relative flex items-stretch transition-all duration-300 ${
                  isPast ? "opacity-70" : "hover:-translate-y-1"
                }`}
              >
                {/* Timeline Node */}
                <div className="hidden md:flex flex-col items-center mr-6">
                  <div
                    className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg ${
                      isPast
                        ? "bg-gray-100 text-gray-400"
                        : isUrgent
                        ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
                        : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {month}
                    </span>
                    <span className="text-2xl font-black">{day}</span>
                  </div>
                </div>

                {/* Card */}
                <div
                  className={`flex-1 rounded-2xl shadow-lg overflow-hidden ${
                    isPast
                      ? "bg-gray-50 border border-gray-200"
                      : isUrgent
                      ? "bg-gradient-to-r from-red-50 to-white border-2 border-red-300 ring-4 ring-red-100"
                      : "bg-white border border-gray-200 hover:shadow-xl"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Mobile Date Badge */}
                        <div className="md:hidden mb-3">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                              isPast
                                ? "bg-gray-200 text-gray-500"
                                : isUrgent
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {month} {day}
                          </span>
                        </div>

                        <div className="flex items-center mb-2">
                          {getIcon()}
                          <h4
                            className={`ml-2 text-lg font-bold ${
                              isPast
                                ? "text-gray-500 line-through"
                                : isUrgent
                                ? "text-red-800"
                                : "text-gray-900"
                            }`}
                          >
                            {item.title}
                          </h4>
                        </div>
                        <p
                          className={`${
                            isPast
                              ? "text-gray-400 line-through"
                              : "text-gray-600"
                          }`}
                        >
                          {item.desc}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="hidden sm:block ml-4">
                        {isPast ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Completed
                          </span>
                        ) : isUrgent ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 animate-pulse">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Coming Up!
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for upcoming urgent items */}
                  {isUrgent && !isPast && (
                    <div className="h-1 bg-gradient-to-r from-red-400 via-red-500 to-red-400 animate-pulse"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DeadlinesTab;
