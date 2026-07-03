export const BEXCO_AREA_MAP =
  "https://www.google.com/maps/place/BEXCO+Exhibition+Center+2/@35.1658098,129.1295755,15z/data=!4m6!3m5!1s0x356892b8f541b779:0xae581e3659fcf1f7!8m2!3d35.1658125!4d129.1350625!16s%2Fg%2F11cs500m5j?entry=ttu";

export const HOTEL_CATEGORIES = {
  luxury: {
    label: "Luxury Hotels",
    hotelIds: ["westin-josun", "paradise", "grand-josun"],
  },
  convenient: {
    label: "Most Convenient (Near Subway)",
    hotelIds: ["felix-stx", "ramada-encore", "shilla-stay"],
  },
  budget: {
    label: "Budget-Friendly",
    hotelIds: ["toyoko-inn", "libero", "marianne"],
  },
};

/** Listed in order of proximity to Haeundae and Dongbaek Stations (Metro Line 2). */
export const HAEUNDAE_HOTELS = [
  {
    id: "westin-josun",
    name: "The Westin Josun Busan",
    address: "67 Dongbaek-ro, Haeundae, Busan, South Korea",
    phone: "+82 51 749 7000",
    highlights: [
      "ISIR 2026 Congress office and speaker hotel",
      "Located on Haeundae Beach and Dongbaek Island",
      "Approximately 15–20 minutes on foot from Haeundae Station",
      "Ideal for speakers and participants wishing to stay at the venue itself",
    ],
    stationAccess: "Dongbaek Station (5 min walk), Haeundae Station (18–20 min walk)",
    tags: ["speaker", "office", "luxury"],
  },
  {
    id: "felix-stx",
    name: "Felix by STX",
    address: "620 Haeun-daero, Haeundae-gu, Busan, South Korea",
    phone: "+82 51 969 5000",
    highlights: [
      "Directly connected to Haeundae Station",
      "Spacious residence-style rooms",
      "Excellent choice for extended stays and families",
    ],
    stationAccess: "Haeundae Station (direct connection, 1 min walk)",
    tags: ["convenient"],
  },
  {
    id: "ramada-encore",
    name: "Ramada Encore by Wyndham Busan Haeundae",
    address: "9 Gunam-ro, Haeundae-gu, Busan, South Korea",
    phone: "+82 51 610 3000",
    highlights: [
      "Adjacent to Haeundae Station Exit 3",
      "Convenient access to restaurants, shopping, and the beach",
      "Popular among business travelers and conference attendees",
    ],
    stationAccess: "Haeundae Station Exit 3 (1 min walk)",
    tags: ["convenient"],
  },
  {
    id: "sunset-business",
    name: "Sunset Business Hotel",
    address: "46 Gunam-ro, Haeundae-gu, Busan, South Korea",
    phone: "+82 51 730 9900",
    highlights: [
      "Short walk from Haeundae Station",
      "Located in the center of Haeundae entertainment district",
      "Good value for international visitors",
    ],
    stationAccess: "Haeundae Station (2 min walk)",
    tags: [],
  },
  {
    id: "best-western",
    name: "Best Western Haeundae Hotel",
    address: "42 Gunam-ro, Haeundae-gu, Busan, South Korea",
    phone: "+82 51 664 1234",
    highlights: [
      "Approximately 5-minute walk to Haeundae Station",
      "Close to Haeundae Beach and the traditional market",
      "International hotel brand with business-friendly services",
    ],
    stationAccess: "Haeundae Station (5 min walk)",
    tags: [],
  },
  {
    id: "shilla-stay",
    name: "Shilla Stay Haeundae",
    address: "46 Haeun-daero 570beon-gil, Haeundae-gu, Busan, South Korea",
    phone: "+82 51 912 9000",
    highlights: [
      "Short walk to Haeundae Station",
      "Beachfront location",
      "Frequently recommended for business and conference travelers",
    ],
    stationAccess: "Haeundae Station (5 min walk)",
    tags: ["convenient"],
  },
  {
    id: "paradise",
    name: "Paradise Hotel Busan",
    address: "296 Haeundaehaebyeon-ro, Haeundae-gu, Busan, South Korea",
    phone: "+82 51 742 2121",
    highlights: [
      "Luxury beachfront hotel",
      "Walking distance to Haeundae Station",
      "One of Busan's most recognizable hotels",
    ],
    stationAccess: "Dongbaek Station (12 min walk) or Haeundae Station (20 min walk)",
    tags: ["luxury"],
  },
  {
    id: "grand-josun",
    name: "Grand Josun Busan",
    address: "292 Haeundaehaebyeon-ro, Haeundae-gu, Busan, South Korea",
    phone: "+82 51 922 5000",
    highlights: [
      "ISIR 2026 Congress speaker hotel",
      "Modern luxury hotel overlooking Haeundae Beach",
      "Convenient access to both the beach and subway",
      "Excellent dining and wellness facilities",
    ],
    stationAccess: "Dongbaek Station (10 min) or Haeundae Station (18 min walk)",
    tags: ["speaker", "luxury"],
  },
  {
    id: "toyoko-inn",
    name: "Toyoko Inn Busan Haeundae 2",
    address: "5 Haeundaehaebyeon-ro 237beon-gil, Haeundae-gu, Busan, South Korea",
    phone: "+82 51 741 1045",
    highlights: [
      "Reliable Japanese business hotel",
      "Complimentary breakfast",
      "Popular among international travelers seeking affordability",
    ],
    stationAccess: "Dongbaek Station (8 min) or Haeundae Station (13 min walk)",
    tags: ["budget"],
  },
  {
    id: "libero",
    name: "LIBERO Hotel",
    address: "21 Gunam-ro 29beon-gil, Haeundae-gu, Busan, South Korea",
    phone: "+82 51 740 2111",
    highlights: [
      "Located near Haeundae Station and Haeundae Beach",
      "Affordable option for trainees and students",
    ],
    stationAccess: "Haeundae Station (7 min walk)",
    tags: ["budget"],
  },
  {
    id: "marianne",
    name: "Haeundae Marianne Hotel, Busan",
    address: "310 Haeundaehaebyeon-ro, Haeundae-gu, Busan, South Korea",
    phone: "+82 51 606 0600",
    highlights: [
      "Budget-conscious accommodation",
      "Walking distance to beach and subway access",
    ],
    stationAccess: "Haeundae Station (7 min walk)",
    tags: ["budget"],
  },
  {
    id: "centum-hotel",
    name: "Haeundae Centum Hotel",
    address: "20 Suyeonggangbyeon-daero, Haeundae-gu, Busan, South Korea",
    phone: "+82 51 720 9000",
    highlights: [
      "Adjacent to BEXCO Convention Center",
      "Direct subway access via Centum City Station",
      "Suitable for attendees planning additional meetings in the convention district",
    ],
    stationAccess: "Centum City Station (2–3 min walk)",
    tags: ["bexco"],
  },
  {
    id: "centum-premier",
    name: "CENTUM PREMIER HOTEL",
    address: "17 Centum 1-ro, Haeundae-gu, Busan, South Korea",
    phone: "+82 51 755 9000",
    highlights: [
      "Located in Centum City",
      "Close to BEXCO and Shinsegae Department Store",
      "Good value business hotel",
    ],
    stationAccess: "Centum City Station (3–5 min walk)",
    tags: ["bexco"],
  },
];
