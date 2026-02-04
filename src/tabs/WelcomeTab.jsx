import React from "react";
import presidentHeadshot from "../assets/welcome/welcome-headshot1.jpg";
import dambaevaHeadshot from "../assets/welcome/welcome-headshot2.jpg";
import presidentSignature from "../assets/welcome/signature1.png";
import dambaevaSignature from "../assets/welcome/signature2.png";

const CHAIRMEN_DATA = [
  {
    name: "Joanne Kwak-Kim",
    title: "President, International Society for Immunology of Reproduction",
    credentials: "MD, MPH, FCRI ASRI",
    image: presidentHeadshot,
    signature: presidentSignature,
    message: (
      <>
        Dear ISIR Members and Guests,
        <br />
        <br />
        On behalf of the Executive Board of the International Society for
        Immunology of Reproduction (ISIR), it is my great honor to invite you to
        the <strong>16ᵗʰ ISIR World Congress</strong>, which will be held{" "}
        <strong>November 5 - 8, 2026, in the Westin Josun, Busan, Korea</strong>
        . This landmark meeting will bring together our global community of
        scientists, clinicians, and trainees to exchange groundbreaking research
        and strengthen the collaborative spirit that defines our Society.
        <br />
        <br />
        The 2026 Congress is organized under the theme:
        <br />
        <strong>
          "Global Dialog on Population Balance and Women's Health through
          Reproductive Immunology."
        </strong>{" "}
        This theme reflects the urgent demographic shifts faced by many nations
        and highlights the essential role of reproductive immunology in
        advancing women's health and reproductive science.
        <br />
        <br />
        I extend my sincere appreciation to the Meeting Chairs, Drs. Svetlana
        Dambaeva, Birdie Lamarca, and Sung-Ki Lee, President-Elect Surendra
        Sharma, and the Scientific Program Organizing Committee, whose
        leadership and dedication are shaping an outstanding scientific program.
        In addition, I express my heartfelt gratitude to our Representative
        Cooperation Directors and local organizers. Their dedication, logistical
        coordination, and tireless efforts have built the foundation for an
        exceptional congress. Their leadership ensures a scientifically
        rigorous, culturally rich, and seamlessly organized meeting for all
        global participants.
        <br />
        <br />
        <strong>A special acknowledgment</strong> goes to{" "}
        <strong>
          Ms. Eunah Kwak, President & CEO of Kangwha Inc., whose major support
          and commitment have been pivotal to
        </strong>{" "}
        the successful planning of the 2026 Busan Congress. Her generosity,
        vision, and steadfast encouragement have significantly strengthened our
        mission and the success of this international gathering. We are also
        grateful for the partnership of the Korean Medical Societies. Their
        collaboration reinforces the important connection between reproductive
        immunology and the broader women's health community in Korea.
        <br />
        <br />
        We warmly encourage you to mark your calendars and begin preparing your
        abstracts and attendance. The 2026 Congress will offer unparalleled
        opportunities for clinical and scientific advancement, networking,
        mentorship, and international collaboration. We look forward to
        welcoming each of you to <strong>Busan in 2026</strong> for a memorable
        and inspiring world congress.
        <br />
        <br />
        With warmest regards,
      </>
    ),
  },
  {
    name: "Svetlana (Lana) Dambaeva",
    title: "Meeting Co-Chair, ISIR 2026 World Congress",
    credentials: "PhD, D(ABMLI), HCLD(ABB)",
    footer: (
      <>
        Director, Clinical Immunology Laboratory
        <br />
        Associate Professor, Center for Cancer Cell Biology, Immunology, and
        Infection
        <br />
        Rosalind Franklin University of Medicine and Science, North Chicago, IL
      </>
    ),
    image: dambaevaHeadshot,
    signature: dambaevaSignature,
    message: (
      <>
        <strong>Dear Colleagues and Friends of ISIR</strong>
        <br />
        <br />I am honored to serve as a co-chair of the{" "}
        <strong>
          16th International Society for Immunology of Reproduction (ISIR) World
          Congress
        </strong>
        . This conference offers a wonderful opportunity to share recent
        advances in your outstanding work with scientists and physicians from
        around the world and to reconnect with colleagues across our field. We
        have received an overwhelmingly enthusiastic response from invited
        experts, reflecting the strong momentum and vitality of our scientific
        community.
        <br />
        <br />
        My background is in medical laboratory diagnostics and endometrial
        immunology, with more than 20 years of experience spanning both basic
        science research and clinical laboratory practice. Throughout my career,
        I have come to deeply value meetings such as ISIR, where scientists and
        clinicians come together to exchange ideas, share expertise, and
        collectively advance our field.
        <br />
        <br />
        I am especially excited that this Congress will be held in Busan,
        marking the first time ISIR is hosted in Korea. It will also be my first
        visit to Korea, and I am very much looking forward to experiencing Busan
        alongside an outstanding scientific program. I hope you will enjoy both
        the science and the setting, and I look forward to welcoming you all to
        Busan.
        <br />
        <br />
        Yours sincerely,
      </>
    ),
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
                  {chair.credentials && (
                    <p className="text-sm text-gray-600 mt-1">
                      {chair.credentials}
                    </p>
                  )}
                  <div className="inline-block">
                    <p className="text-sm font-medium text-[#f3b72c] uppercase tracking-wider px-4 py-1 bg-[#f3b72c]/10 rounded-full">
                      {chair.title}
                    </p>
                  </div>
                  {chair.footer && (
                    <div className="text-xs text-gray-600 mt-3 leading-relaxed">
                      {chair.footer}
                    </div>
                  )}
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
                    <div className="text-gray-800 leading-[1.9] text-[17px] font-light tracking-wide">
                      {chair.message}
                    </div>
                    {chair.signature && (
                      <div className="mt-6 flex justify-start">
                        <img
                          src={chair.signature}
                          alt={`${chair.name} signature`}
                          className="h-16 md:h-20 object-contain"
                        />
                      </div>
                    )}
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
