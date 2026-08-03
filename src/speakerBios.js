/**
 * Scannable speaker profiles (layout C: Who / Focus / Why / At ISIR).
 * Keys are speaker profile `id` values from the public API.
 *
 * @typedef {{
 *   who: string,
 *   focus: string[],
 *   why: string,
 *   atIsir?: string,
 * }} SpeakerBio
 */

/** @type {Record<string, SpeakerBio>} */
const SPEAKER_BIOS = {
  "seed-cheong-seok-kim": {
    who: "Professor of Sociology and Director of the Center for Collaborative Research on Population and Society at Dongguk University. Former President of the Population Association of Korea (2024–2025).",
    focus: [
      "Population policy",
      "Low fertility",
      "Population aging",
      "Social welfare",
    ],
    why: "His research frames the demographic challenges facing Korea and other aging societies — from declining birth rates to healthcare sustainability and family change.",
    atIsir:
      "Insights on demographic transition and policy responses in aging societies.",
  },
  "seed-sam-richards": {
    who: "Award-winning sociologist at Penn State and Distinguished Professor at Konkuk University; co-founder of the World in Conversation Center. Known worldwide for SOC 119 and his TEDx talk on radical empathy.",
    focus: [
      "Empathy & dialogue",
      "Social change",
      "Korean society",
      "Demographic challenges",
    ],
    why: "He connects culture, family, work-life balance, and social expectations to Korea’s population crisis in a way that reaches far beyond the academy.",
    atIsir:
      "How cultural values and social structures shape declining birth rates.",
  },
  "81d6c431-d364-4c51-bc61-d724923f7824": {
    who: "Professor and Director of Reproductive Medicine & Immunology at Rosalind Franklin University, and President of ISIR. One of the world’s leading clinician-scientists in reproductive immunology.",
    focus: [
      "Recurrent pregnancy loss",
      "Implantation failure",
      "Ovarian aging",
      "Immune tolerance",
    ],
    why: "ScholarGPS (2026) ranked her the world’s top active clinician-scientist in reproductive immunology, and her program No. 1 worldwide — bridging lab insight and patient care.",
    atIsir:
      "Chronic inflammation, immune dysregulation, and strategies to preserve fertility in ovarian aging.",
  },
  "seed-gil-mor": {
    who: "Physician-scientist at Wayne State University School of Medicine and a founder of modern reproductive immunology. Previously built major maternal-fetal programs at Yale.",
    focus: [
      "Maternal–fetal immunity",
      "Implantation",
      "Immune clock",
      "Preeclampsia",
    ],
    why: "His “immune clock of pregnancy” reframed gestation as a timed sequence of inflammatory and anti-inflammatory phases — still shaping the field.",
    atIsir:
      "Antiviral defense at the maternal–fetal interface, and how protection is balanced for mother and fetus.",
  },
  "24c1f6f0-b400-43ff-965d-2a793c5fad5c": {
    who: "Founder of CHA Medical Group and CHA University; a pioneering leader in reproductive medicine and regenerative healthcare across Asia.",
    focus: [
      "IVF & ART",
      "Fertility preservation",
      "Stem cell medicine",
      "Women’s health systems",
    ],
    why: "He built one of Asia’s largest clinical and academic networks for fertility and regenerative care, helping establish Korea as a global leader in the field.",
    atIsir:
      "A vision for fertility care, regenerative medicine, and innovation against declining birth rates.",
  },
  "e8ca4d46-aec4-4538-9dfc-aba127737f9f": {
    who: "Reproductive immunologist at UTMB; former Brown University professor. President-Elect of ISIR, past President of ASRI, and former Editor-in-Chief of the American Journal of Reproductive Immunology.",
    focus: [
      "Maternal–fetal tolerance",
      "Uterine NK cells",
      "RPL & RIF",
      "Preeclampsia",
    ],
    why: "Four decades of NIH-supported work and 400+ publications defined key immune mechanisms of implantation, pregnancy maintenance, and major obstetric complications.",
    atIsir:
      "Latest advances in maternal–fetal immune regulation and better pregnancy outcomes.",
  },
  "seed-ricardo-barini": {
    who: "Collaborating Professor at UNICAMP (Brazil) and a leading Latin American expert in reproductive immunology. Trained under Dr. Allan E. Beer; FCRI (ASRI).",
    focus: [
      "Recurrent pregnancy loss",
      "Implantation failure",
      "Assisted reproduction",
      "Fetal medicine",
    ],
    why: "He founded Brazil’s first public RPL clinic and a specialty lab/clinic that has cared for more than 5,000 patients with miscarriage and implantation failure.",
    atIsir:
      "Leads the Public Forum — evidence-based guidance for patients and families on RPL, unexplained infertility, and implantation failure.",
  },
  "b304fe03-6283-4acb-8e57-700acc42f5eb": {
    who: "Associate Medical Director at Harley Street Fertility Clinic (London). Over four decades advancing fertility care as a clinician and early adopter of reproductive immunology in the UK.",
    focus: [
      "Recurrent implantation failure",
      "Recurrent pregnancy loss",
      "Reproductive immunology",
      "Assisted reproduction",
    ],
    why: "Former Medical Director of NURTURE and CARE Fertility Nottingham; helped bring ICSI and Beer-inspired immune approaches into UK fertility practice.",
    atIsir:
      "Public Forum clinician bridging scientific advances with patient care for miscarriage, RIF, and unexplained infertility.",
  },
  "aa467dc5-a47d-4364-9911-1119013f69e2": {
    who: "Professor and Director of Infertility and Reproductive Endocrinology at Kyungpook National University School of Medicine. Local Scientific Committee member for ISIR 2026.",
    focus: [
      "Reproductive endocrinology",
      "Recurrent miscarriage",
      "Ovarian insufficiency",
      "ART",
    ],
    why: "A leading Korean clinician-scientist linking endocrine care, implantation biology, and immune mechanisms in complex infertility.",
    atIsir:
      "Translational advances in reproductive endocrinology and immunology to improve fertility outcomes.",
  },
  "55c6fc80-faac-4367-bbd1-ade9df16f4cd": {
    who: "IVF specialist at HI Fertility Center (Seoul); fellowship-trained in reproductive immunology at Rosalind Franklin University. Representative Cooperation Director for ISIR 2026.",
    focus: [
      "IVF",
      "Implantation failure",
      "Recurrent pregnancy loss",
      "Precision fertility care",
    ],
    why: "She co-authored national practice guidelines in reproductive immunology and integrates immune-based strategies into modern IVF for complex cases.",
    atIsir:
      "Clinical strategies for optimizing implantation and pregnancy through precision and immune-informed care.",
  },
  "9f9d0232-c4e3-4812-bdba-50a413970060": {
    who: "Director of Samsung Jeil Women’s Clinic (Busan). Trained at Samsung Cheil, Bourn Hall (Cambridge), and Rosalind Franklin’s reproductive immunology clinic. Representative Cooperation Director for ISIR 2026.",
    focus: [
      "IVF",
      "RIF & RPL",
      "Fertility preservation",
      "Ovarian reserve",
    ],
    why: "International training lets her combine cutting-edge ART with reproductive immunology in day-to-day patient care.",
    atIsir:
      "Contemporary infertility management and personalized approaches to assisted reproduction.",
  },
  "seed-jei-won-moon": {
    who: "Director of M Fertility Center (Seoul) and Clinical Professor at Asan Medical Center. Board member of ISIVF; active in international collaboration for Korean reproductive medicine.",
    focus: [
      "Advanced maternal age",
      "RIF & RPL",
      "POI & PCOS",
      "Fertility preservation",
    ],
    why: "His practice and research target complex infertility — from implantation failure to ovarian dysfunction — with an eye toward translational IVF strategies.",
    atIsir:
      "Clinical approaches to recurrent implantation failure and precision IVF to improve pregnancy outcomes.",
  },
};

/** Resolve a scannable bio for a public speaker row (by profile id). */
export function getSpeakerBio(speaker) {
  if (!speaker) return null;
  const byId = SPEAKER_BIOS[speaker.id];
  if (byId) return byId;
  // Vite stub uses `dev-seed-${key}`; production seeds use `seed-${key}`.
  if (speaker.key) {
    const bySeedKey = SPEAKER_BIOS[`seed-${speaker.key}`];
    if (bySeedKey) return bySeedKey;
  }
  return null;
}

export default SPEAKER_BIOS;
