import React from "react";

// Placeholder data - Replace with actual content and image paths
const CHAIRMEN_DATA = [
  {
    name: "Dr. Sang-Mook Lee",
    title: "Conference Chair",
    image: "https://placehold.co/400x400?text=SL", // Replace with /src/assets/chairman1.jpg
    message: `Dear Colleagues and Friends,

It is my great honor and pleasure to welcome you to the International Society for Intelligence Research (ISIR) 2026 Conference here in the beautiful city of Busan, South Korea.

As we gather to share our latest research and insights, we also celebrate the growing diversity and global reach of our society. This year's program promises to be stimulating, covering a wide range of topics that reflect the dynamic nature of intelligence research today.`,
  },
  {
    name: "Dr. Jane Doe",
    title: "Program Committee Chair",
    image: "https://placehold.co/400x400?text=JD", // Replace with /src/assets/chairman2.jpg
    message: `Welcome to ISIR 2026!

We have worked hard to curate a scientific program that balances foundational theories with cutting-edge methodologies. We are particularly excited about the interdisciplinary sessions scheduled for this year, which we believe will spark new collaborations and ideas.

I encourage you all to take full advantage of the networking opportunities and enjoy the hospitality of Busan.`,
  },
];

const WelcomeTab = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-[#1a3a6c] mb-4">
          Welcome Message
        </h2>
        <div className="h-1 w-20 bg-[#f3b72c] mx-auto"></div>
      </div>

      <div className="grid gap-8">
        {CHAIRMEN_DATA.map((chair, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col md:flex-row hover:shadow-xl transition-shadow duration-300"
          >
            {/* Image Section */}
            <div className="md:w-1/3 bg-gray-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-100">
              <div className="text-center">
                <div className="w-40 h-40 mx-auto mb-4 rounded-full overflow-hidden border-4 border-[#1a3a6c] shadow-md">
                  <img
                    src={chair.image}
                    alt={chair.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#1a3a6c]">
                  {chair.name}
                </h3>
                <p className="text-[#f3b72c] font-semibold">{chair.title}</p>
              </div>
            </div>

            {/* Text Section */}
            <div className="md:w-2/3 p-8 relative">
              {/* Decorative Quote Icon */}
              <div className="absolute top-4 right-6 text-6xl text-gray-100 font-serif leading-none select-none">
                "
              </div>

              <div className="relative z-10 text-gray-700 leading-relaxed whitespace-pre-line">
                {chair.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeTab;
