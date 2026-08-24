import React from "react";

const TYPE_STYLES = {
  symposium: {
    panel: "bg-amber-50 border-amber-200",
    accent: "bg-amber-400",
    code: "bg-amber-200 text-amber-950",
    room: "bg-white/80 text-amber-900 border border-amber-200",
  },
  oral: {
    panel: "bg-amber-50/70 border-amber-100",
    accent: "bg-amber-200",
    code: "bg-amber-100 text-amber-900 border border-amber-200",
    room: "bg-white text-amber-800 border border-amber-100",
  },
  forum: {
    panel: "bg-sky-50 border-sky-200",
    accent: "bg-sky-400",
    code: "bg-sky-200 text-sky-950",
    room: "bg-white/80 text-sky-900 border border-sky-200",
  },
  plenary: {
    panel: "bg-orange-50 border-orange-200",
    accent: "bg-orange-400",
    code: "bg-orange-400 text-white",
    room: "bg-white/80 text-orange-900 border border-orange-200",
  },
  population: {
    panel: "bg-orange-50 border-orange-200",
    accent: "bg-orange-300",
    code: "bg-orange-200 text-orange-950",
    room: "bg-white/80 text-orange-900 border border-orange-200",
  },
  poster: {
    panel: "bg-emerald-50 border-emerald-200",
    accent: "bg-emerald-300",
    code: "bg-emerald-100 text-emerald-900 border border-emerald-200",
    room: "bg-white text-emerald-800 border border-emerald-100",
  },
  social: {
    panel: "bg-emerald-50 border-emerald-200",
    accent: "bg-emerald-400",
    code: "bg-emerald-200 text-emerald-950",
    room: "bg-white/80 text-emerald-900 border border-emerald-200",
  },
  gala: {
    panel: "bg-blue-900 border-blue-900 text-white",
    accent: "bg-[#f3b72c]",
    code: "bg-[#f3b72c] text-blue-950",
    room: "bg-white/15 text-white",
  },
  meeting: {
    panel: "bg-green-50 border-green-200",
    accent: "bg-green-400",
    code: "bg-green-200 text-green-950",
    room: "bg-white/80 text-green-900 border border-green-200",
  },
  registration: {
    panel: "bg-amber-100/60 border-amber-200",
    accent: "bg-amber-300",
    code: "bg-amber-200 text-amber-950",
    room: "bg-white text-amber-900 border border-amber-200",
  },
  break: {
    panel: "bg-gray-100 border-gray-200",
    accent: "bg-gray-300",
    code: "bg-gray-200 text-gray-700",
    room: "bg-white text-gray-600 border border-gray-200",
  },
};

function inferSessionType(code, type) {
  if (type) return type;
  if (!code) return "symposium";
  const c = code.toUpperCase();
  if (c.startsWith("PF") || c.includes("FORUM")) return "forum";
  if (c.startsWith("N")) return "oral";
  if (c.includes("POPULATION")) return "population";
  if (c.includes("PRESIDENT")) return "plenary";
  return "symposium";
}

function inferEventType(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("gala")) return "gala";
  if (t.includes("poster")) return "poster";
  if (t.includes("registration")) return "registration";
  if (t.includes("reception") || t.includes("social") || t.includes("enjoy busan"))
    return "social";
  if (t.includes("meeting")) return "meeting";
  if (
    t.includes("coffee") ||
    t.includes("lunch") ||
    t.includes("breakfast") ||
    t.includes("intermission") ||
    t.includes("adjourn")
  )
    return "break";
  return "break";
}

function Talk({ time, title, speaker, affiliation, compact = false }) {
  // Time-only placeholder slots (oral abstract times)
  if (compact && time && !title && !speaker) {
    return (
      <div className="py-1 border-t border-black/5 first:border-t-0 text-xs">
        <span className="font-bold tabular-nums text-gray-500">{time}</span>
      </div>
    );
  }

  // Placeholder slots (time + title only): keep on one line when compact
  if (compact && time && title && !speaker) {
    return (
      <div className="flex gap-2 items-baseline py-1 border-t border-black/5 first:border-t-0 text-xs">
        <span className="font-bold tabular-nums text-gray-500 shrink-0">
          {time}
        </span>
        <span className="font-semibold text-gray-800">{title}</span>
      </div>
    );
  }

  return (
    <div
      className={`${compact ? "py-2" : "py-3"} border-t border-black/5 first:border-t-0`}
    >
      {time && (
        <div className="inline-block text-[11px] font-bold tabular-nums mb-1 px-1.5 py-0.5 rounded bg-white/70 text-gray-600 border border-black/5">
          {time}
        </div>
      )}
      <div
        className={`font-semibold text-gray-900 leading-snug ${compact ? "text-xs" : "text-sm"}`}
      >
        {title}
      </div>
      {speaker && (
        <div
          className={`mt-1 leading-snug ${compact ? "text-[11px]" : "text-xs"}`}
        >
          <span className="font-bold" style={{ color: "var(--color-primary)" }}>
            {speaker}
          </span>
          {affiliation && (
            <span className="text-gray-500 block mt-0.5">{affiliation}</span>
          )}
        </div>
      )}
    </div>
  );
}

function Session({
  code,
  title,
  room,
  moderators,
  note,
  type,
  children,
  compact = false,
  className = "",
}) {
  const kind = inferSessionType(code, type);
  const styles = TYPE_STYLES[kind] || TYPE_STYLES.symposium;
  const isDark = kind === "gala";
  const isForum = kind === "forum";
  const isCompact = compact || isForum;

  return (
    <section
      className={`min-w-0 rounded-xl border overflow-hidden flex flex-col ${styles.panel} ${className}`}
    >
      <div className={`shrink-0 ${isForum ? "h-1" : "h-1.5"} ${styles.accent}`} />
      <div className={`flex-1 flex flex-col ${isCompact ? "p-3" : "p-4"}`}>
        {/* Fixed header area so talk lists start on the same row across columns */}
        <div
          className={`shrink-0 ${children ? "mb-3" : ""} ${
            isForum ? "min-h-0" : "min-h-[4.75rem]"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {code && (
              <span
                className={`text-xs font-bold tracking-wide px-2 py-0.5 rounded ${styles.code}`}
              >
                {code}
              </span>
            )}
            {room && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded ${styles.room}`}
              >
                {room}
              </span>
            )}
          </div>
          <h5
            className={`font-bold leading-snug ${isCompact ? "text-sm" : "text-base"} ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {title}
          </h5>
          {moderators && (
            <p
              className={`text-xs mt-1.5 ${isDark ? "text-white/80" : "text-gray-600"}`}
            >
              <span className="font-semibold">Moderator:</span> {moderators}
            </p>
          )}
          {note && (
            <p
              className={`text-xs italic mt-1.5 ${isDark ? "text-white/70" : "text-gray-500"}`}
            >
              {note}
            </p>
          )}
        </div>
        {children && (
          <div className="pl-3 ml-0.5 border-l-2 border-black/10 flex-1">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

function ParallelSessions({ children, cols = 3, equalHeight = true }) {
  const colClass =
    cols === 4
      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
      : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
  return (
    <div
      className={`grid ${colClass} gap-4 lg:gap-5 mb-8 ${
        equalHeight ? "items-stretch [&>*]:h-full" : "items-start"
      }`}
    >
      {children}
    </div>
  );
}

/** Sessions + Public Forum in the same time slot */
function ConcurrentBlock({ time, children, side }) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-bold tabular-nums text-gray-700">
          {time}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-200">
          Concurrent
        </span>
        <span className="text-xs text-gray-500">
          Scientific sessions &amp; Public Forum run at the same time
        </span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start">
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch [&>*]:h-full">
          {children}
        </div>
        {/* Forum stays shorter and top-aligned */}
        <div className="min-w-0">{side}</div>
      </div>
    </div>
  );
}

function DaySection({ id, label, date, theme, children }) {
  return (
    <section id={id} className="mb-14 scroll-mt-24">
      <div
        className="rounded-xl px-5 py-4 mb-6 text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, #1e3a5f 100%)",
        }}
      >
        <div className="text-sm font-medium text-white/80">{date}</div>
        <h4 className="text-xl font-bold mt-0.5">{label}</h4>
        {theme && <p className="text-sm text-white/90 mt-1 italic">{theme}</p>}
      </div>
      {children}
    </section>
  );
}

function TimeRow({ time, title, room, type }) {
  const kind = type || inferEventType(title);
  const styles = TYPE_STYLES[kind] || TYPE_STYLES.break;
  const isDark = kind === "gala";

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 px-4 mb-2 rounded-lg border ${styles.panel}`}
    >
      <div
        className={`text-xs font-bold tabular-nums w-40 shrink-0 ${isDark ? "text-white/80" : "text-gray-600"}`}
      >
        {time}
      </div>
      <div
        className={`text-sm font-bold flex-1 ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {title}
      </div>
      {room && (
        <div
          className={`text-xs font-medium px-2 py-0.5 rounded ${styles.room}`}
        >
          {room}
        </div>
      )}
    </div>
  );
}

function BreakBlock({ time, title, room }) {
  return (
    <div className="my-5">
      <TimeRow time={time} title={title} room={room} type="break" />
    </div>
  );
}

function BlockLabel({ children }) {
  return (
    <h5
      className="text-sm font-bold uppercase tracking-wide mt-10 mb-4 pb-2 border-b-2"
      style={{
        color: "var(--color-primary)",
        borderColor: "var(--color-primary)",
      }}
    >
      {children}
    </h5>
  );
}

const LEGEND = [
  { label: "Plenary / President", cls: "bg-orange-400" },
  { label: "Symposium", cls: "bg-amber-200" },
  { label: "Oral Presentations", cls: "bg-amber-50 border border-amber-300" },
  { label: "Public Forum", cls: "bg-sky-300" },
  { label: "Population Forum", cls: "bg-orange-300" },
  { label: "Poster / Social", cls: "bg-emerald-200" },
  { label: "Meeting", cls: "bg-green-200" },
  { label: "Break", cls: "bg-gray-200" },
];

const ORAL_SLOT_TIMES = [
  "4:00 – 4:11 PM",
  "4:11 – 4:22 PM",
  "4:22 – 4:33 PM",
  "4:33 – 4:44 PM",
  "4:44 – 4:55 PM",
  "4:55 – 5:06 PM",
];

function OralSlotList() {
  return ORAL_SLOT_TIMES.map((time) => (
    <Talk key={time} compact time={time} />
  ));
}


const ProgramTab = () => {
  const days = [
    { id: "opening", label: "Opening Day", short: "Nov 5" },
    { id: "day1", label: "Day I", short: "Nov 6" },
    { id: "day2", label: "Day II", short: "Nov 7" },
    { id: "day3", label: "Day III", short: "Nov 8" },
  ];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div role="tabpanel">
      <header className="flex items-center mb-6">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        </div>
        <div>
          <h3
            className="text-2xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            Congress Program
          </h3>
          <p className="text-gray-500 text-sm">
            November 5–8, 2026 · Busan, Korea
          </p>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap gap-2">
        {days.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => scrollTo(d.id)}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {d.label}
            <span className="text-gray-400 font-normal ml-1.5">{d.short}</span>
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <strong className="text-gray-700">Note:</strong> This program is subject
        to change. Session titles marked TBD and oral presentation slots will be
        updated as speakers and abstracts are confirmed.
      </p>

      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-8 p-4 bg-gray-50 rounded-xl">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${item.cls}`} />
            <span className="text-xs font-medium text-gray-700">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* ─── Opening Day ─── */}
      <DaySection
        id="opening"
        label="Opening Day"
        date="Thursday, November 5, 2026"
      >
        <TimeRow time="1:00 – 5:00 PM" title="Registration" room="Foyer, 3rd Floor" />
        <TimeRow
          time="2:30 – 4:00 PM"
          title="ISIR Council Meeting"
          room="Room D (1st Floor)"
        />
        <TimeRow time="5:00 – 8:00 PM" title="Welcome Reception" />
      </DaySection>

      {/* ─── Day I ─── */}
      <DaySection
        id="day1"
        label="Day I"
        date="Friday, November 6, 2026"
        theme="Reproductive Immunology at the Forefront of Population Health"
      >
        <TimeRow time="7:30 – 8:30 AM" title="Breakfast" room="Foyer, 3rd Floor" />
        <TimeRow time="7:30 AM – 6:00 PM" title="Registration" room="Foyer, 3rd Floor" />

        <BlockLabel>President Symposium I · Rooms A–C</BlockLabel>
        <Session
          type="plenary"
          title="President Symposium I"
          room="Rooms A–C"
          moderators="Joanne Kwak-Kim and Surendra Sharma"
          className="mb-6"
        >
          <Talk
            time="8:30 – 9:10 AM"
            title="Immune Dysregulation in the Ovarian Insufficiency Spectrum"
            speaker="Joanne Kwak-Kim"
            affiliation="Chicago Medical School, Rosalind Franklin University of Medicine and Science, USA"
          />
          <Talk
            time="9:10 – 9:50 AM"
            title="Reproductive Aging and Management Using K Cells"
            speaker="Kwang Yul Cha"
            affiliation="CHA University, Korea"
          />
        </Session>

        <BreakBlock time="9:50 – 10:05 AM" title="Coffee Break" />

        <BlockLabel>
          Scientific Sessions &amp; Public Forum · 10:05 – 11:45 AM
        </BlockLabel>

        <ConcurrentBlock
          time="10:05 – 11:45 AM"
          side={
            <Session
              code="PF I"
              title="Public Forum I"
              room="Room D, 1st Floor"
              note="Ask the Expert · Pre-registration required"
            >
              <Talk
                compact
                time="10:05 – 11:45 AM"
                title="Clinical Practice of Reproductive Immunology"
                speaker="Na Young Kim"
                affiliation="HI Fertility Center, Seoul, Korea"
              />
              <Talk
                compact
                speaker="Kook Sun Han"
                affiliation="Samsung Cheil Women's Clinic, Busan, Korea"
              />
            </Session>
          }
        >
        <Session
          code="S1"
          title="Immune Regulation in the Endometrium"
          room="Room A"
          moderators="Renate van der Molen, Radboudumc, Netherlands; Tao Zhang, The Chinese University of Hong Kong, China"
        >
          <Talk
            time="10:05 – 10:30 AM"
            title="Immune Regulation of Endometrium Healing and Scarring Following Natural and Cesarean Delivery"
            speaker="Emilia Solano"
            affiliation="Clinic St. Hedwig, University Medical Center Regensburg, Germany"
          />
          <Talk
            time="10:30 – 10:55 AM"
            title="Single-cell-level Digital Twins for Preterm Birth Prevention Strategies"
            speaker="Brice Gaudilliere"
            affiliation="Stanford University, USA"
          />
          <Talk
            time="10:55 – 11:20 AM"
            title="How Endometrial Inflammation and Immune Remodeling Shape Implantation and Early Pregnancy"
            speaker="Lianghui Diao"
            affiliation="Shenzhen Zhongshan Obstetrics & Gynecology Hospital, Shenzhen, China"
          />
          <Talk
            time="11:20 – 11:45 AM"
            title="MSC-derived Therapeutics to Restore Compromised Uterine Environments"
            speaker="Haengseok Song"
            affiliation="CHA University, Korea"
          />
        </Session>

        <Session
          code="S2"
          title="Gynecologic Malignancies and Immune Abnormalities"
          room="Room B"
          moderators="Young Tae Kim, Yonsei University, College of Medicine, Korea; Sandra Blois, UKE, Germany"
        >
          <Talk
            time="10:05 – 10:30 AM"
            title="Ovarian Tumor-Induced Suppression of Anti-tumor Immunity and Its Prevention"
            speaker="Animesh Barua"
            affiliation="Simmaron Research, USA"
          />
          <Talk
            time="10:30 – 10:55 AM"
            title="The Role of Cancer-Associated Cells in Ovarian Cancer Microenvironment"
            speaker="Eun Ju Lee"
            affiliation="Chung-Ang University School of Medicine, Korea"
          />
          <Talk
            time="10:55 – 11:20 AM"
            title="From Bench to Bedside: Transforming Gynecologic Care with Organoids and Patient Biospecimens"
            speaker="Eun Ji Nam"
            affiliation="Yonsei University, Korea"
          />
          <Talk
            time="11:20 – 11:45 AM"
            title="Mechanism of Immune Escape in Gynecologic Malignancies and Its Therapeutic Modulation"
            speaker="Hiroshi Nishio"
            affiliation="Keio University, Japan"
          />
        </Session>

        <Session
          code="S3"
          title="Environmental Exposures and Developmental Origins of Disease"
          room="Room C"
          moderators="Jelmer Prins, University of Groningen, Netherlands; Nardhy Gomez-Lopez, Washington University School of Medicine, USA"
        >
          <Talk
            time="10:05 – 10:30 AM"
            title="Maternal Infections during Pregnancy"
            speaker="Petra Arck"
            affiliation="Universitätsklinikum Hamburg-Eppendorf, Hamburg, Germany"
          />
          <Talk
            time="10:30 – 10:55 AM"
            title="Impact of Microplastics at Maternal-Fetal Interface"
            speaker="Yong Sun Maeng"
            affiliation="Yonsei University, Korea"
          />
          <Talk
            time="10:55 – 11:20 AM"
            title="TBD"
            speaker="Anke Diemert"
            affiliation="Universitätsklinikum Hamburg-Eppendorf, Hamburg, Germany"
          />
          <Talk
            time="11:20 – 11:45 AM"
            title="GOLDEN: Gene Expression and Allele-informed Decomposition for Genetic Heterogeneity in Spatial Transcriptomic Data"
            speaker="Hyojung Paik"
            affiliation="Korea Institute of Science and Technology Information, Korea"
          />
        </Session>
        </ConcurrentBlock>

        <TimeRow
          time="11:45 AM – 1:30 PM"
          title="Poster Session I · Lunch Provided"
          room="Room E, 1st Floor"
        />
        <TimeRow time="11:45 AM – 1:30 PM" title="Lunch" />

        <BlockLabel>Population Forum I · Rooms A–C, 3rd Floor</BlockLabel>
        <Session
          type="population"
          code="Population Forum I"
          title="Population Aging in Korea: Demographic Realities, Societal Change, and Reproductive Health"
          room="Rooms A–C, 3rd Floor"
          note="Foundational overview of Korea's population crisis through demographic data, social context, and reproductive medicine."
          className="mb-6"
        >
          <Talk
            time="1:30 – 2:10 PM"
            title="Ultra-Low Fertility in Korea: Social Dynamics and Reproductive Healthcare Implications"
            speaker="Cheong-Seok Kim"
            affiliation="Dongguk University, Korea"
          />
          <Talk time="2:10 – 2:20 PM" title="Q & A" />
        </Session>

        <TimeRow time="2:20 – 2:30 PM" title="Intermission" />

        <BlockLabel>Scientific Sessions · 2:30 – 3:45 PM</BlockLabel>

        <ParallelSessions>
        <Session
          code="S4"
          title="KI Symposium"
          room="Room A"
          moderators="Haengseok Song, CHA University, Korea; Hwang Kyung Joo"
        >
          <Talk
            time="2:30 – 2:55 PM"
            title="Precision Immunotherapy with Intravenous Immunoglobulin (IVIG) in Women with Reproductive Failure: From Biomarker Profiling to Clinical Practice"
            speaker="Sungki Lee"
            affiliation="Konyang University, Korea"
          />
          <Talk
            time="2:55 – 3:20 PM"
            title="The Endometrium at the Maternal-Fetal Interface: From Regenerative Organoids to Functional Receptivity-On-A-Chip"
            speaker="Yunjung Kang"
            affiliation="CHA University, Korea"
          />
          <Talk
            time="3:20 – 3:45 PM"
            title="Redefining Protein S Deficiency Cutoff Values for Women with Reproductive Failure"
            speaker="Jaewon Han"
            affiliation="Konyang University, Korea"
          />
        </Session>

        <Session
          code="S5"
          title="Microbiome and Pregnancy Outcomes"
          room="Room B"
          moderators="Alison Kohlmeier, Emory University, School of Medicine, USA; Ismael Mancilla-Herrera, National Institute of Perinatologia Isidro Espinosa de los Reyes, México"
        >
          <Talk
            time="2:30 – 2:55 PM"
            title="Mom Matters: Maternal Influences on Infant Gut Microbiome and Health in 714 Mother-Infant Pairs in the Lifelines NEXT Cohort"
            speaker="Trisha Sinha"
            affiliation="University Medical Center Groningen (UMCG), Netherlands"
          />
          <Talk
            time="2:55 – 3:20 PM"
            title="Microbiome-Host Interactions and Pregnancy Outcomes"
            speaker="David MacIntyre"
            affiliation="Robinson Research Institute, Adelaide University, Australia"
          />
          <Talk
            time="3:20 – 3:45 PM"
            title="Sperm Immunology — Past, Present, and Future"
            speaker="Hiroaki Shibahara"
            affiliation="Hanabusa Women's Clinic, Kobe Chuo Ward, Japan"
          />
        </Session>

        <Session
          code="S6"
          title="Male Infertility"
          room="Room C"
          moderators="Surabhi Gupta, All India Institute of Medical Sciences, India; Lachlan Moldenhauer, Adelaide University, Australia"
        >
          <Talk
            time="2:30 – 2:55 PM"
            title="Identification of Glycoprotein A in Seminal Plasma as a Potent Inhibitor of the Coagulation Cascade: Implications for Sperm Immune Tolerance"
            speaker="Jaeho Lee"
            affiliation="CHA University, Korea"
          />
          <Talk
            time="2:55 – 3:20 PM"
            title="Local Innate Immunity Cytokine Network Contributes to Male Reproductive Failure"
            speaker="Maciej Kurpisz"
            affiliation="Institute of Human Genetics, Polish Academy of Science, Poland"
          />
          <Talk
            time="3:20 – 3:45 PM"
            title="Human Sperm as Modulators of Female Reproductive Tract Immunity"
            speaker="David Sharkey"
            affiliation="Adelaide University, Australia"
          />
        </Session>
        </ParallelSessions>

        <BreakBlock time="3:45 – 4:00 PM" title="Coffee Break" />

        <BlockLabel>Oral Presentations · 4:00 – 5:06 PM</BlockLabel>

        <ParallelSessions equalHeight={false}>
        <Session
          type="oral"
          title="Young Investigator Award Competition"
          room="Room A"
          moderators="Svetlana Dambaeva, Chicago Medical School, RFUMS, USA; Atsushi Fukui"
          note="Oral presentations (will be selected from abstracts)"
        >
          <OralSlotList />
        </Session>

        <Session
          code="N1"
          title="New Research Findings I · Pre-Conception, Fertility & Reproductive Disorders"
          room="Room B"
          note="Oral presentations (will be selected from abstracts)"
        >
          <OralSlotList />
        </Session>

        <Session
          code="N2"
          title="New Research Findings II · Early Pregnancy and Implantation"
          room="Room C"
          note="Oral presentations (will be selected from abstracts)"
        >
          <OralSlotList />
        </Session>
        </ParallelSessions>

        <TimeRow time="5:30 – 8:00 PM" title="Trainee Social" room="TBD" />
      </DaySection>

      {/* ─── Day II ─── */}
      <DaySection
        id="day2"
        label="Day II"
        date="Saturday, November 7, 2026"
        theme="Translating Reproductive Immunology into Clinical Practice"
      >
        <TimeRow time="7:30 – 8:30 AM" title="Breakfast" room="Foyer, 3rd Floor" />
        <TimeRow time="7:30 AM – 6:00 PM" title="Registration" room="Foyer, 3rd Floor" />

        <BlockLabel>Scientific Sessions · 8:35 – 9:50 AM · 3rd Floor</BlockLabel>

        <ParallelSessions>
        <Session
          code="S7"
          title="Immune Mechanisms of Female Reproductive Aging"
          room="Room A"
          moderators="Jung Ryeol Lee, Seoul National University, College of Medicine, Korea; Alek Stanik-Kostic, University of Wisconsin, Madison, USA"
        >
          <Talk
            time="8:35 – 9:00 AM"
            title="Immune Disturbances in Female Reproductive Aging"
            speaker="Xue Jiao"
            affiliation="Center for Reproductive Medicine, Shandong University, China"
          />
          <Talk
            time="9:00 – 9:25 AM"
            title="Immune and Inflammatory Mechanisms Underlying Ovarian Dysfunction"
            speaker="Akira Iwase"
            affiliation="Gunma University Graduate School of Medicine, Maebashi, Japan"
          />
          <Talk
            time="9:25 – 9:50 AM"
            title="Endometrial Functions in Recurrent Pregnancy Loss"
            speaker="Nicoletta Di Simone"
            affiliation="Humanitas University, Italy"
          />
        </Session>

        <Session
          code="S8"
          title="Preeclampsia and Its Systemic Consequences"
          room="Room B"
          moderators="Seppo Heinone, University of Helsinki, Helsinki University Hospital, Finland; Nathan E. Campbell, The University of Mississippi Medical Center, USA"
        >
          <Talk
            time="8:35 – 9:00 AM"
            title="Autophagy on Guard: Self-Defense against Syncytiotrophoblast"
            speaker="Akitoshi Nakashima"
            affiliation="University of Toyama, Japan"
          />
          <Talk
            time="9:00 – 9:25 AM"
            title="Reprogramming Macrophages: A New Paradigm for Preventing Preterm Labor"
            speaker="Hee Young Cho"
            affiliation="Seoul National University, Korea"
          />
          <Talk
            time="9:25 – 9:50 AM"
            title="The Sugar Code Under Pressure: Glycosylation in Preeclampsia"
            speaker="Sandra Blois"
            affiliation="Universitätsklinikum Hamburg-Eppendorf, Germany"
          />
        </Session>

        <Session
          code="S9"
          title="Rheumatic Conditions and Reproductive Outcomes"
          room="Room C"
          moderators="Joon Woo Kim, Chicago Medical School, RFUHS, USA; Angela Alvarez, Universidad de Antioquia, Colombia"
        >
          <Talk
            time="8:35 – 9:00 AM"
            title="Bridging Autoimmunity and Pregnancy Complications; Immunological Therapeutic Approaches for Improving Pregnancy Outcomes"
            speaker="Sayaka Tsuda"
            affiliation="University of Toyama, Japan"
          />
          <Talk
            time="9:00 – 9:25 AM"
            title="Correlation between Positive Autoimmune Antibodies and Pregnancy Outcomes"
            speaker="Li Wu"
            affiliation="University of Science and Technology of China, China"
          />
          <Talk
            time="9:25 – 9:50 AM"
            title="The Value of Screening and Intervention of Thyroid Autoantibodies in the Patients with Recurrent Pregnancy Loss"
            speaker="Hong Zhang"
          />
        </Session>
        </ParallelSessions>

        <BreakBlock time="9:50 – 10:05 AM" title="Coffee Break" />

        <BlockLabel>
          Scientific Sessions &amp; Public Forum · 10:05 – 11:45 AM
        </BlockLabel>

        <ConcurrentBlock
          time="10:05 – 11:45 AM"
          side={
            <Session
              code="PF II"
              title="Public Forum II"
              room="Room D, 1st Floor"
              note="Ask the Expert · Pre-registration required"
            >
              <Talk
                compact
                time="10:05 – 11:45 AM"
                title="Patient and Physician in Dialogue: Practical Insights into IVF Failure and Immune Treatment"
                speaker="George Ndukwe"
                affiliation="Harley Street Fertility Clinic, London, UK"
              />
              <Talk
                compact
                speaker="Joon Cheol Park"
                affiliation="Kyungpook National University, Korea"
              />
            </Session>
          }
        >
        <Session
          code="S10"
          title="Ovarian Inflammatory Disease and Aging"
          room="Room A"
          moderators="Kyung Ah Lee, CHA University Global IVF Group, Korea; Jie Zhao; Maria Dinorah Salazar Garcia, Rush University Medical Center, USA"
        >
          <Talk
            time="10:05 – 10:30 AM"
            title="Translational Research in Ovarian Function Restoration: From Unmet Needs to Scientific Advances"
            speaker="Jung Ryeol Lee"
            affiliation="Seoul National University, Korea"
          />
          <Talk
            time="10:30 – 10:55 AM"
            title="Immune Dysfunction in PMOS (Formerly PCOS): An Underrecognized Driver of Disease and a Promising Therapeutic Target"
            speaker="Malimi Laloraya"
            affiliation="University of Kerala, India"
          />
          <Talk
            time="10:55 – 11:20 AM"
            title="Inflammaging and Its Impact on Human Reproduction"
            speaker="Huang Zhongwei"
            affiliation="National University of Singapore, Singapore"
          />
          <Talk
            time="11:20 – 11:45 AM"
            title="Autoimmune Modulation of Immune-Endocrine-Metabolic Regulation of Ovarian Reserve"
            speaker="Aera Han"
            affiliation="CHA University, Korea"
          />
        </Session>

        <Session
          code="S11"
          title="Preeclampsia and Its Systemic Consequences"
          room="Room B"
          moderators="Valerie Tiempo Guinto, University of the Philippines–Philippine General Hospital, Philippines; Owen Herrock, the University of Gothenburg, Sweden"
        >
          <Talk
            time="10:05 – 10:30 AM"
            title="Preeclampsia and the Brain"
            speaker="Lina Bergman"
            affiliation="University of Gothenburg, Sweden"
          />
          <Talk
            time="10:30 – 10:55 AM"
            title="Inflammation and Autoantibodies; Long Term Consequences of Preeclampsia"
            speaker="Babette LaMarca"
            affiliation="University of Mississippi School of Medicine, USA"
          />
          <Talk
            time="10:55 – 11:20 AM"
            title="Vascular Targets of Inflammation Mediating Maternal Microvascular Dysfunction after Preeclampsia"
            speaker="Ana Stanhewicz"
            affiliation="University of Iowa, USA"
          />
          <Talk
            time="11:20 – 11:45 AM"
            title="A Galectin-9-Driven CD11high Decidual Macrophage Subset Suppresses Uterine Vascular Remodeling in Preeclampsia"
            speaker="Meirong Du"
            affiliation="Fudan University, Shanghai, China"
          />
        </Session>

        <Session
          code="S12"
          title="Current Immunotherapeutic Options for Reproductive Health"
          room="Room C"
          moderators="Giovanni Jubiz, Center for Reproductive Immunology & Infertility, USA; Maria Socorro Agcaoili, University of the Philippines–Philippine General Hospital, Philippines"
        >
          <Talk
            time="10:05 – 10:30 AM"
            title="Neoself Autoantibody (anti-β2GPI/HLA-DR) Involved in Recurrent Pregnancy Loss and Infertility"
            speaker="Hideto Yamada"
            affiliation="Teine Keijinkai Hospital, Japan"
          />
          <Talk
            time="10:30 – 10:55 AM"
            title="TBD"
            speaker="Conor Harrity"
            affiliation="RCSI University of Medicine and Health Sciences, Ireland"
          />
          <Talk
            time="10:55 – 11:20 AM"
            title="Developing IL-10 Encapsulated Exosomes as Novel Therapeutics for Spontaneous Preterm Birth"
            speaker="Ananth Kumar Kammala"
            affiliation="University of Texas Medical Branch, Galveston, USA"
          />
          <Talk
            time="11:20 – 11:45 AM"
            title="ImmuLIT®: A Novel Immunomodulatory Approach in Recurrent Reproductive Failure"
            speaker="Mohan Raut"
            affiliation="Dr. Raut's Center for Reproductive Immunology, India"
          />
        </Session>
        </ConcurrentBlock>

        <TimeRow
          time="11:45 AM – 1:00 PM"
          title="Poster Session II · Lunch Provided"
          room="Room E, 1st Floor"
        />
        <TimeRow time="11:45 AM – 1:00 PM" title="Lunch" />

        <BlockLabel>Scientific Sessions · 1:00 – 2:15 PM</BlockLabel>

        <ParallelSessions>
        <Session
          code="S13"
          title="Exosome, Mitochondrial Function, and Cell-Based Therapies"
          room="Room A"
          moderators="Ann-Charlotte Iversen, Norwegian University of Science and Technology, Norway; Mariana Garcia, University Medical Center Hamburg-Eppendorf, Germany"
        >
          <Talk
            time="1:00 – 1:25 PM"
            title="The Role of Trophoblast Extracellular Vesicles in Regulating Maternal Physiology During Pregnancy"
            speaker="Larry Chamley"
            affiliation="University of Auckland, New Zealand"
          />
          <Talk
            time="1:25 – 1:50 PM"
            title="Immune Deterrence by the Chorion Trophoblast: Protecting the Feto-Maternal Interface"
            speaker="Ramkumar Menon"
            affiliation="The University of Texas Medical Branch at Galveston, USA"
          />
          <Talk
            time="1:50 – 2:15 PM"
            title="Placenta-derived Extracellular Vesicles: Dialogue with Maternal Immune Cells"
            speaker="Udo Markert"
            affiliation="University Hospital Jena, Germany"
          />
        </Session>

        <Session
          code="S14"
          title="Infection, Inflammation, and Pregnancy"
          room="Room B"
          moderators="Jacob Kohlmeier, Emory University School of Medicine, USA; Maria Emilia Solano, University of Regensburg, Germany"
        >
          <Talk
            time="1:00 – 1:25 PM"
            title="Inflammation in Pregnancy: From Physiological Roles to Therapeutic Targets"
            speaker="Yasuyuki Negishi"
            affiliation="Nippon Medical School, Japan"
          />
          <Talk
            time="1:25 – 1:50 PM"
            title="Maternal Influences, the Microbiome, and Early-Life Immune Development"
            speaker="Jelmer Prins"
            affiliation="University of Groningen, Netherlands"
          />
          <Talk
            time="1:50 – 2:15 PM"
            title="Maternal Infection and Placental Barrier"
            speaker="Shihoko Komine-Aizawa"
            affiliation="Nihon University School of Medicine, Japan"
          />
        </Session>

        <Session
          code="S15"
          title="Update on Reproductive Disorders and Management"
          room="Room C"
          moderators="Iryna Sudoma, Reproductive Clinic Nadiya, Ukraine; Thanh Luu, Chicago Medical School, RFUMS, USA"
        >
          <Talk
            time="1:00 – 1:25 PM"
            title="Tacrolimus Treatment in Reproductive Failures"
            speaker="Koji Nakagawa"
            affiliation="Sugiyama Obstetrics and Gynecology Hospital, Japan"
          />
          <Talk
            time="1:25 – 1:50 PM"
            title="Towards Successful Pregnancy: Advances in the Understanding and Management of Recurrent Pregnancy Loss and Chronic Histiocytic Intervillositis"
            speaker="Marie-Louise van der Hoorn"
            affiliation="Leiden University Medical Centre, Netherlands"
          />
          <Talk
            time="1:50 – 2:15 PM"
            title="Clinical Application of Endometrial and Peripheral NK cell Subpopulations: Diagnostic and Therapeutic Approaches for RIF and RPL"
            speaker="Atsushi Fukui"
            affiliation="Fukushima Medical University, Japan"
          />
        </Session>
        </ParallelSessions>

        <BlockLabel>Scientific Sessions · 2:15 – 3:55 PM</BlockLabel>

        <ParallelSessions>
        <Session
          code="S16"
          title="T Cell Immunity and Pregnancy"
          room="Room A"
          moderators="Birdie LaMarca, University of Mississippi Medical Center, USA; Aera Han, CHA University, Korea"
        >
          <Talk
            time="2:15 – 2:40 PM"
            title="T Cells Shape Pregnancy Outcomes in Chronic Placental Inflammation"
            speaker="Nardhy Gomez-Lopez"
            affiliation="Washington University School of Medicine in St. Louis, USA"
          />
          <Talk
            time="2:40 – 3:05 PM"
            title="Maternal T Cell Responses Against the Fetal Placenta During Chronic Villitis"
            speaker="Elizabeth Enniga"
            affiliation="Mayo Clinic, USA"
          />
          <Talk
            time="3:05 – 3:30 PM"
            title="T Cell Immunity and Pregnancy"
            speaker="Wenjuan Wang"
            affiliation="Shanghai Jiao Tong University, China"
          />
          <Talk
            time="3:30 – 3:55 PM"
            title="Balancing Tolerance and Defense at the Villous Trophoblast Surface"
            speaker="Kenichiro Motomura"
            affiliation="National Center for Child Health and Development, Japan"
          />
        </Session>

        <Session
          code="S17"
          title="Fetal Outcome with Inflammatory Insult"
          room="Room B"
          moderators="Youssef Derbala, Derbala Institute for Reproductive Immunology, USA; Raj Raghupathy, Kuwait University, Kuwait"
        >
          <Talk
            time="2:15 – 2:40 PM"
            title="Inflammation, Vascular Lesions, and Fetal Health"
            speaker="Gendi Lash"
            affiliation="Guangzhou Women and Children's Medical Center, China"
          />
          <Talk
            time="2:40 – 3:05 PM"
            title="Placental Contributions to Sex-Specific Offspring Neurodevelopment"
            speaker="Eunha Kim"
            affiliation="Korea University, Korea"
          />
          <Talk
            time="3:05 – 3:30 PM"
            title="Fetal Outcomes of Pregnancies with an Inflammatory Insult"
            speaker="Cherie Ocampo-Cervantes"
            affiliation="University of the Philippines, Philippines"
          />
          <Talk
            time="3:30 – 3:55 PM"
            title="Placental-, Immune- and Vascular Changes in Obstetrical Syndromes"
            speaker="Gabor Nandor Than"
            affiliation="Semmelweis University, Hungary"
          />
        </Session>

        <Session
          code="S18"
          title="Early Pregnancy and Placental Development"
          room="Room C"
          moderators="Gil Mor, Wayne State University School of Medicine, USA; Diana M Morales-Prieto, Jena University Hospital, Germany"
        >
          <Talk
            time="2:15 – 2:40 PM"
            title="Defining Antigenic Drivers of the Early Pregnancy Treg Cell Response"
            speaker="Sarah Robertson"
            affiliation="University of Adelaide, Australia"
          />
          <Talk
            time="2:40 – 3:05 PM"
            title="Pregnancy-Expanded Regulatory T Cells Constrain Maternal Inflammation to Protect Fetal Neurodevelopment"
            speaker="Ho-Keun Kwon"
            affiliation="Yonsei University, Korea"
          />
          <Talk
            time="3:05 – 3:30 PM"
            title="Maternal and Trophoblast Immune Responses to Cytomegalovirus Infection"
            speaker="Takeshi Nagamatsu"
            affiliation="International University of Health and Welfare, Japan"
          />
          <Talk
            time="3:30 – 3:55 PM"
            title="Novel Diagnostic Method to Diagnose Chronic Endometritis"
            speaker="Tao Judy Zhang"
            affiliation="The Chinese University of Hong Kong, China"
          />
        </Session>
        </ParallelSessions>

        <BreakBlock time="3:55 – 4:05 PM" title="Coffee Break" />

        <BlockLabel>New Research Findings · 4:00 – 5:06 PM</BlockLabel>
        <ParallelSessions equalHeight={false}>
        <Session
          code="N3"
          title="New Research Findings III · Immune Regulation in Reproduction"
          room="Room A"
          note="Oral presentations (will be selected from abstracts)"
        >
          <OralSlotList />
        </Session>
        <Session
          code="N4"
          title="New Research Findings IV · Immunity, Environment, and Reproductive Fate"
          room="Room B"
          note="Oral presentations (will be selected from abstracts)"
        >
          <OralSlotList />
        </Session>
        <Session
          code="N5"
          title="New Research Findings V · Maternal-Fetal Immunology & Gestational Complications"
          room="Room C"
          note="Oral presentations (will be selected from abstracts)"
        >
          <OralSlotList />
        </Session>
        </ParallelSessions>
      </DaySection>

      {/* ─── Day III ─── */}
      <DaySection
        id="day3"
        label="Day III"
        date="Sunday, November 8, 2026"
        theme="Advancing Women's Health and Population Sustainability Through Global Collaboration"
      >
        <TimeRow time="7:30 – 8:30 AM" title="Breakfast" room="Foyer, 3rd Floor" />
        <TimeRow
          time="7:30 AM – 12:00 PM"
          title="Registration"
          room="Foyer, 3rd Floor"
        />

        <BlockLabel>President Symposium II · Rooms A–C, 3rd Floor</BlockLabel>
        <Session
          type="plenary"
          title="President Symposium II"
          room="Rooms A–C, 3rd Floor"
          moderators="Joanne Kwak-Kim and Surendra Sharma"
          className="mb-6"
        >
          <Talk
            time="8:30 – 9:10 AM"
            title="Fetal Sex Programs Immune Cellular Differentiation at the Maternal–Fetal Interface"
            speaker="Gil Mor"
            affiliation="C.S. Mott Center for Human Growth and Development, School of Medicine, Wayne State University, USA"
          />
          <Talk
            time="9:10 – 9:50 AM"
            title="Preeclampsia and Brain: Alzheimer's Etiology in Younger Populations"
            speaker="Surendra Sharma"
            affiliation="The University of Texas Medical Branch–UTMB, USA"
          />
        </Session>

        <BreakBlock time="9:50 – 10:05 AM" title="Coffee Break" />

        <BlockLabel>
          Scientific Sessions &amp; Public Forum · 10:05 – 11:45 AM
        </BlockLabel>

        <ConcurrentBlock
          time="10:05 – 11:45 AM"
          side={
            <Session
              code="PF III"
              title="Public Forum III"
              room="Room D, 1st Floor"
              note="Ask the Expert · Pre-registration required"
            >
              <Talk
                compact
                time="10:05 – 11:45 AM"
                title="How to Address Patients for the Diagnosis and Treatment of RPL and RIF"
                speaker="Ricardo Barini"
                affiliation="Universidade Estadual de Campinas, Campinas, Brazil"
              />
              <Talk
                compact
                speaker="Jae Won Moon"
                affiliation="M Fertility Clinic, Seoul, Korea"
              />
            </Session>
          }
        >
        <Session
          code="S19"
          title="Immune Regulation and Therapeutic Application of Human Reproduction"
          room="Room A"
          moderators="Mayumi Sugiura-Ogasawara, Nagoya City University, Japan; Jayesh Amin, NOVA WINGS IVF Group / Association of Reproductive Genetics and Immunology, India"
        >
          <Talk
            time="10:05 – 10:30 AM"
            title="Biofabrication of Female Reproductive Organs: Vascularized Ovary Chip"
            speaker="Young Shik Choi"
            affiliation="Yonsei University, Korea"
          />
          <Talk
            time="10:30 – 10:55 AM"
            title="Regulation of Decidual Immune Composition"
            speaker="Alek Stanik-Kostic"
            affiliation="University of Wisconsin, Madison, USA"
          />
          <Talk
            time="10:55 – 11:20 AM"
            title="Evaluation of Endometrial Gene Expression in Women with Reproductive Failures"
            speaker="Svetlana Dambaeva"
            affiliation="Rosalind Franklin University of Medicine and Science, USA"
          />
          <Talk
            time="11:20 – 11:45 AM"
            title="The Double-Edged Sword: Cytokines Shaping Autoimmune and Inflammatory Diseases Progression or Remission in Pregnancy"
            speaker="Marie-Pierre Piccinni"
            affiliation="University of Florence, Italy"
          />
        </Session>

        <Session
          code="S20"
          title="High Risk OB, 2nd/3rd Trimester Complications"
          room="Room B"
          moderators="Yoshimitsu Kuwabara, Nippon Medical School, Japan; Archana Sampath, Indian Council of Medical Research Headquarters, India"
        >
          <Talk
            time="10:05 – 10:30 AM"
            title="Maternal Vitamin D Deficiency and Adverse Pregnancy Outcomes: Clinical Evidence for a Critical Window and Emerging Immunological Mechanisms"
            speaker="Ji Yeon Lee"
            affiliation="CHA University, Korea"
          />
          <Talk
            time="10:30 – 10:55 AM"
            title="Multimodal Single-Cell Analyses Reveal Subclinical Dysfunction and Limited Metformin Efficacy in Placentas of Women with PMOS"
            speaker="Qiaolin Deng"
            affiliation="The Wenner-Gren Institute, Stockholm University, Sweden"
          />
          <Talk
            time="10:55 – 11:20 AM"
            title="Precision Medicine in Cervical Insufficiency: Optimizing Cervical Cerclage for Preterm Birth Prevention"
            speaker="Keun-Young Lee"
            affiliation="Hallym University, Korea"
          />
          <Talk
            time="11:20 – 11:45 AM"
            title="Senescence of Decidual Macrophages in Advanced Maternal Age and Adverse Pregnancy Outcomes"
            speaker="Aihua Liao"
            affiliation="Huazhong University of Science and Technology, China"
          />
        </Session>

        <Session
          code="S21"
          title="Immunotherapeutic Options for Reproductive Failures"
          room="Room C"
          moderators="Mugdha Raut, Dr. Raut's Center For Reproductive Immunology, India; Jie Zhao, Peking University Third Hospital, China"
        >
          <Talk
            time="10:05 – 10:30 AM"
            title="Evidence-based Immunotherapeutic Options for Reproductive Failure"
            speaker="Ole Christiansen"
            affiliation="Center for Recurrent Pregnancy Loss of Western Denmark, Aalborg, Denmark"
          />
          <Talk
            time="10:30 – 10:55 AM"
            title="From Micronutrients to Reproductive Immune Readiness: Reframing Preconception Care through Reproductive Immunology"
            speaker="Kuniaki Ota"
            affiliation="Fukushima Medical University, Japan"
          />
          <Talk
            time="10:55 – 11:20 AM"
            title="Personalized Immunotherapy for RPL and RIF in Korean Patients: From Evidence to Practice"
            speaker="Joon Cheol Park"
            affiliation="Kyungpook National University, Korea"
          />
          <Talk
            time="11:20 – 11:45 AM"
            title="Current Immunotherapeutic Options for Reproductive Failure"
            speaker="Marcelo Cavalcante"
            affiliation="University of Fortaleza (UNIFOR), Brazil"
          />
        </Session>
        </ConcurrentBlock>

        <TimeRow
          time="11:45 AM – 1:00 PM"
          title="Business Meeting"
          room="Room A"
        />
        <TimeRow time="11:45 AM – 1:00 PM" title="Lunch" />

        <BlockLabel>Population Forum II · Rooms A–C, 3rd Floor</BlockLabel>
        <Session
          type="population"
          code="Population Forum II"
          title="Future Direction: What Do We Need to Improve Population Concerns"
          room="Rooms A–C, 3rd Floor"
          className="mb-6"
        >
          <Talk
            time="1:00 – 2:00 PM"
            title="Fertility, Families and What Korea Can Teach Us About The Demographic Cliff That The World is Approaching"
            speaker="Sam Richards"
            affiliation="Pennsylvania State University, USA"
          />
          <Talk time="2:00 – 2:20 PM" title="Q & A" />
        </Session>

        <TimeRow time="2:00 – 6:00 PM" title="Enjoy Busan — Go to the Gala!" />
        <TimeRow
          time="6:00 – 9:00 PM"
          title="Award Gala"
          room="Busan Cinema Center"
        />
        <TimeRow time="9:00 PM" title="Adjourn" />
      </DaySection>
    </div>
  );
};

export default ProgramTab;
