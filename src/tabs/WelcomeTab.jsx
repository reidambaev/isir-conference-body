import React from "react";
import headshot1 from "../assets/headshots/headshot1.jpg";
import headshot2 from "../assets/headshots/headshot2.png";

// Placeholder data - Replace with actual content and image paths
const CHAIRMEN_DATA = [
  {
    name: "Dr. Sang-Mook Lee",
    title: "Conference Chair",
    image: headshot1,
    message: `Dear Colleagues and Friends,

It is with genuine excitement that I welcome you to the International Society for Intelligence Research (ISIR) 2026 Conference in the vibrant coastal city of Busan, South Korea. Having spent countless hours planning this gathering, I am thrilled to finally see our community come together in person.

Busan holds a special place in my heart—its blend of traditional Korean culture and modern innovation mirrors the very essence of our field. As you explore the city's historic temples, bustling markets, and stunning coastline, I hope you'll find inspiration that enriches both your research and your experience here.

This year's conference represents something truly special. We've seen an unprecedented number of submissions from researchers spanning six continents, and the quality of work being presented is remarkable. From groundbreaking neuroimaging studies to innovative computational models, our program showcases the incredible breadth and depth of intelligence research today.

I encourage you to step outside your comfort zones—attend sessions outside your immediate area of expertise, strike up conversations during coffee breaks, and share your ideas freely. Some of the most transformative research emerges from these unexpected connections.`,
  },
  {
    name: "Dr. Jane Doe",
    title: "Program Committee Chair",
    image: headshot2,
    message: `Welcome to ISIR 2026!

As Program Committee Chair, I've had the privilege of reviewing hundreds of submissions over the past year, and I can honestly say this is one of the most compelling programs we've assembled. The passion and innovation evident in your work has been truly inspiring.

What excites me most about this year's program is how it bridges the gap between established research traditions and emerging frontiers. You'll find sessions that honor the foundational work that built our field alongside presentations that challenge our assumptions and push boundaries. This balance—between honoring our past and embracing our future—is what makes ISIR conferences so valuable.

I'm particularly looking forward to our interdisciplinary panels, where cognitive scientists, neuroscientists, and computational researchers will engage in dialogue that rarely happens elsewhere. These conversations often lead to the kind of cross-pollination that generates entirely new research directions.

Beyond the scientific program, I hope you'll immerse yourself in everything Busan has to offer. Whether you're sampling fresh seafood at Jagalchi Market, watching the sunset from Haeundae Beach, or exploring the ancient temples nestled in the mountains, these experiences often provide the mental space needed for breakthrough insights.

Please don't hesitate to reach out if you have questions or ideas you'd like to discuss. This conference belongs to all of us, and your engagement is what makes it meaningful.`,
  },
];

const WelcomeTab = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-light text-[#1a3a6c] mb-3 tracking-tight">
          Welcome Message
        </h2>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#f3b72c] to-transparent mx-auto"></div>
      </div>

      <div className="space-y-20">
        {CHAIRMEN_DATA.map((chair, index) => (
          <div
            key={index}
            className={`relative ${
              index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
            } flex flex-col gap-12 items-start`}
          >
            {/* Image Section - Vertical Layout */}
            <div className="md:w-1/4 flex-shrink-0">
              <div className="sticky top-8">
                <div className="relative mb-6">
                  <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden shadow-2xl ring-4 ring-[#1a3a6c]/10">
                    <img
                      src={chair.image}
                      alt={chair.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-[#f3b72c] rounded-full opacity-20"></div>
                </div>
                <div className="text-center space-y-2 pt-4">
                  <h3 className="text-2xl font-semibold text-[#1a3a6c] tracking-tight">
                    {chair.name}
                  </h3>
                  <div className="inline-block">
                    <p className="text-sm font-medium text-[#f3b72c] uppercase tracking-wider px-4 py-1 bg-[#f3b72c]/10 rounded-full">
                      {chair.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Section - Magazine Style */}
            <div className="md:w-3/4 flex-1">
              <div className="relative">
                {/* Accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#f3b72c] via-[#1a3a6c] to-transparent rounded-full"></div>
                
                <div className="pl-8 pr-4">
                  <div className="prose prose-lg max-w-none">
                    <div className="text-gray-800 leading-[1.9] text-[17px] font-light tracking-wide whitespace-pre-line">
                      {chair.message}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeTab;
