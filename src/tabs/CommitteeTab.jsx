import React from "react";
import headshots from "../assets/congress_chairs.png";

const CommitteeTab = () => (
  <div role="tabpanel">
    <h3
      className="text-2xl font-bold text-blue-900 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Program Committee
    </h3>
    <p className="text-gray-700 mb-6">
      Our distinguished committee of world-renowned experts in reproductive
      immunology is dedicated to curating an exceptional scientific program that
      addresses the most pressing challenges and opportunities in our field.
    </p>

    {/* Congress Chairs Photo */}
    <div className="mb-8">
      <h4
        className="text-xl font-semibold text-blue-800 mb-4"
        style={{ color: "var(--color-primary)" }}
      >
        Congress Chairs
      </h4>
      <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
        <img
          src={headshots}
          alt="Headshots of congress chairs"
          className="rounded-lg shadow-md"
        />
      </div>
    </div>

    <h4
      className="text-xl font-semibold text-blue-800 mt-6 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Scientific Committee Members
    </h4>
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 text-gray-700 text-sm justify-center">
        <p>Nardhy Gomez-Lopez (USA)</p>
        <p>Sylvie Girard (USA)</p>
        <p>Petra Arck (Germany)</p>
        <p>David Sharkey (Australia)</p>
        <p>Atsushi Fukui (Japan)</p>
        <p>Sarah Robertson (Australia)</p>
        <p>Satish K Gupta (India)</p>
        <p>Udo Markert (Germany)</p>
        <p>Sandra Blois (Germany)</p>
        <p>Marie Pierre Piccinni (Italy)</p>
        <p>Akitoshi Nakashima (Japan)</p>
        <p>Shigeru Saito (Japan)</p>
        <p>Aihua Liao (China)</p>
        <p>Nathalie Ledee (France)</p>
        <p>Chandrakant Tayade (Canada)</p>
        <p>Jelmer Prins (Netherlands)</p>
        <p>Nandor Gabor Than (Hungary)</p>
        <p>Gendie Lash (China)</p>
        <p>Aleksandar Stanic-Kostic (USA)</p>
        <p>Tamara Tilburgs (USA)</p>
        <p>Lorena Amaral (USA)</p>
        <p>Thanh Luu (USA)</p>
        <p>Haiming Wei (China)</p>
        <p>Meirong Du (China)</p>
        <p>Liang Hui Diao (China)</p>
        <p>Da-Jin Li (China)</p>
        <p>Marcelo Cavalcante (Brazil)</p>
        <p>Conor Harrity (Ireland)</p>
        <p>Deepak Modi (India)</p>
        <p>Mohan Raut (India)</p>
        <p>Mugdha Raut (India)</p>
        <p>Michael Eikmans (Netherlands)</p>
        <p>Brice Gaudilliere (USA)</p>
        <p>Wael Saab (UK)</p>
        <p>Lujain Alsubki (Saudi Arabia)</p>
        <p>Stella Goulopoulou (USA)</p>
        <p>Gus Dekker (Australia)</p>
        <p>Sandra Davidge (Canada)</p>
        <p>Phil Bennett (UK)</p>
        <p>Larry Chamley (New Zealand)</p>
        <p>Cherie Ocampo-Cervantes (Philippines)</p>
      </div>
    </div>

    <h4
      className="text-xl font-semibold text-blue-800 mt-8 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Local Scientific Committee Members
    </h4>
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-2 text-gray-700 text-sm justify-center">
        <p className="py-1">Kyung-Joo Hwang (Korea)</p>
        <p className="py-1">Jae Kwan Lee (Korea)</p>
        <p className="py-1">Ja Young Kwon (Korea)</p>
        <p className="py-1">Haeng Seok Song (Korea)</p>
        <p className="py-1">Joon Cheol Park (Korea)</p>
      </div>
    </div>

    <h4
      className="text-xl font-semibold text-blue-800 mt-8 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Representative Cooperation Directors
    </h4>
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 text-gray-700 text-sm">
        <div className="flex items-center py-1 justify-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              HC
            </span>
          </div>
          <span>Hyejin Cho</span>
        </div>
        <div className="flex items-center py-1 justify-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              KH
            </span>
          </div>
          <span>Kuksun Han</span>
        </div>
        <div className="flex items-center py-1 justify-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              NK
            </span>
          </div>
          <span>Nayoung Kim</span>
        </div>
        <div className="flex items-center py-1 justify-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              AH
            </span>
          </div>
          <span>Aera Han</span>
        </div>
      </div>
    </div>
  </div>
);

export default CommitteeTab;
