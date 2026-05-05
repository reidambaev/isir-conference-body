import React, { useCallback, useEffect, useRef, useState } from "react";
import { CONGRESS_WEEKEND_MEAL_KEYS, CONGRESS_WEEKEND_MEALS } from "../config/constants";

const CHECKIN_READER_ID = "checkin-html5-qrcode";

const REGISTRATION_TICKET_LABELS = {
  "isir-member": "ISIR Member",
  "non-member": "Non-Member",
  "trainee-member": "Trainee / Student Member",
  "trainee-non-member": "Trainee / Student Non-Member",
  "invited-speaker": "Invited Speaker",
  "korea-day-pass": "Daypass (Korean locals only)",
};

const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeWeekendMealDayList(raw) {
  const LEGACY = { "Nov 6": "Friday", "Nov 7": "Saturday", "Nov 8": "Sunday" };
  if (raw == null || raw === "") return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const arr = Array.isArray(parsed) ? parsed : [];
    const out = [];
    for (const d of arr) {
      if (CONGRESS_WEEKEND_MEAL_KEYS.includes(d)) out.push(d);
      else if (LEGACY[d]) out.push(LEGACY[d]);
    }
    return out;
  } catch {
    return [];
  }
}

function registrationBreakfastDaysForDisplay(reg) {
  const fromBreakfast = normalizeWeekendMealDayList(reg.breakfast_days);
  if (fromBreakfast.length > 0) return fromBreakfast;
  return normalizeWeekendMealDayList(reg.dinner_days);
}

function getMealDisplayRows(dayKeys) {
  if (!Array.isArray(dayKeys) || dayKeys.length === 0) return [];
  return dayKeys.map((key) => {
    const row = CONGRESS_WEEKEND_MEALS.find((item) => item.key === key);
    return {
      key,
      day: row?.key || key,
      date: row?.date || "",
    };
  });
}

export default function CheckinTab() {
  const [lookupLoading, setLookupLoading] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("idle");
  const [scannerError, setScannerError] = useState("");
  const [manualRegistrationId, setManualRegistrationId] = useState("");
  const [scannedValue, setScannedValue] = useState("");
  const [resolvedRegistration, setResolvedRegistration] = useState(null);
  const [lastAttemptedId, setLastAttemptedId] = useState("");
  const isLocalhost =
    typeof window !== "undefined" && LOCALHOST_NAMES.has(window.location.hostname);

  const html5QrRef = useRef(null);
  const stoppingRef = useRef(false);
  /** Ignore rapid repeats of the same registration id while the camera stays on. */
  const lookupInFlightRef = useRef(false);
  const lastExtractedIdRef = useRef("");
  const lastScanAtRef = useRef(0);
  const SAME_ID_COOLDOWN_MS = 2000;

  const stopScanner = useCallback(async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    const inst = html5QrRef.current;
    html5QrRef.current = null;
    if (inst) {
      try {
        if (inst.isScanning) {
          await inst.stop();
        }
      } catch {
        // ignore if already stopped
      }
      try {
        inst.clear();
      } catch {
        // ignore
      }
    }
    stoppingRef.current = false;
    setScannerStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  const extractRegistrationIdFromScan = useCallback((text) => {
    const raw = String(text || "").trim();
    if (!raw) return "";
    const lineMatch = raw.match(/Registration ID:\s*([^\n\r]+)/i);
    if (lineMatch?.[1]) return lineMatch[1].trim();
    return raw;
  }, []);

  const fetchCheckinById = useCallback(
    async (rawText) => {
      const extractedId = extractRegistrationIdFromScan(rawText);
      setScannedValue(String(rawText || ""));
      setResolvedRegistration(null);

      if (!extractedId) {
        setScannerError("No registration ID in that scan.");
        setLastAttemptedId("");
        return;
      }

      setLastAttemptedId(extractedId);
      setLookupLoading(true);
      setScannerError("");
      try {
        const res = await fetch(
          `/api/checkin/registration/${encodeURIComponent(extractedId)}`,
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success || !json?.data) {
          setScannerError(json?.error || "Registration not found.");
          return;
        }
        setResolvedRegistration(json.data);
      } catch (err) {
        setScannerError(err?.message || "Lookup failed.");
      } finally {
        setLookupLoading(false);
      }
    },
    [extractRegistrationIdFromScan],
  );

  const startScanner = useCallback(async () => {
    setScannerError("");
    setScannedValue("");

    if (scannerStatus === "running") return;

    const el = document.getElementById(CHECKIN_READER_ID);
    if (!el) {
      setScannerError("Scanner not ready. Reload the page.");
      return;
    }

    try {
      lastExtractedIdRef.current = "";
      lastScanAtRef.current = 0;
      await stopScanner();
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode(CHECKIN_READER_ID);
      html5QrRef.current = html5QrCode;
      setScannerStatus("running");

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: minQrBoxSize(), height: minQrBoxSize() },
          aspectRatio: 1.777,
        },
        async (decodedText) => {
          if (stoppingRef.current) return;
          const extractedId = extractRegistrationIdFromScan(decodedText);
          if (!extractedId) return;
          const now = Date.now();
          if (lookupInFlightRef.current) return;
          if (
            lastExtractedIdRef.current === extractedId &&
            now - lastScanAtRef.current < SAME_ID_COOLDOWN_MS
          ) {
            return;
          }
          lastExtractedIdRef.current = extractedId;
          lastScanAtRef.current = now;
          lookupInFlightRef.current = true;
          try {
            await fetchCheckinById(decodedText);
          } finally {
            lookupInFlightRef.current = false;
          }
        },
        () => {
          /* per-frame scan errors — ignore */
        },
      );
    } catch (err) {
      setScannerStatus("error");
      setScannerError(
        err?.message || "Camera failed to start. Allow camera access and retry.",
      );
      html5QrRef.current = null;
      setScannerStatus("idle");
    }
  }, [
    extractRegistrationIdFromScan,
    fetchCheckinById,
    scannerStatus,
    stopScanner,
  ]);

  const loadLocalExample = useCallback(() => {
    if (!isLocalhost) return;
    setLookupLoading(false);
    setScannerError("");
    setScannedValue("LOCALHOST_EXAMPLE_DATA");
    setLastAttemptedId("");
    setResolvedRegistration({
      id: "EXAMPLE-0001",
      first_name: "Taylor",
      last_name: "Kim",
      email: "taylor.kim@example.com",
      ticket_type: "isir-member",
      accompanying_count: 1,
      is_invited_speaker: 0,
      opening_reception_attending: 1,
      gala_dinner_attending: 0,
      lunch_days: JSON.stringify(["Friday", "Saturday"]),
      breakfast_days: JSON.stringify(["Saturday", "Sunday"]),
    });
  }, [isLocalhost]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Badge check-in</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">
          Scan the QR on the confirmation PDF or type the registration ID below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-base font-semibold text-gray-900">Camera scanner</h3>
          <p className="mb-4 text-sm text-gray-600">Point your camera at the attendee QR code.</p>
          <div
            id={CHECKIN_READER_ID}
            className="rounded-lg overflow-hidden bg-gray-900 min-h-[280px] w-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={() => void startScanner()}
              disabled={scannerStatus === "running" || lookupLoading}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-60"
            >
              {scannerStatus === "running" ? "Scanning…" : "Start"}
            </button>
            <button
              type="button"
              onClick={() => void stopScanner()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Stop
            </button>
          </div>
          {scannerError ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {scannerError}
            </p>
          ) : null}
          {scannedValue ? (
            <p className="mt-2 break-words rounded-md bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600">
              Scanned payload: {scannedValue}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-base font-semibold text-gray-900">Manual lookup</h3>
          <p className="mb-4 text-sm text-gray-600">Use this when camera scanning is unavailable.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualRegistrationId}
              onChange={(e) => setManualRegistrationId(e.target.value)}
              placeholder="Paste registration ID or scanned text"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={() => fetchCheckinById(manualRegistrationId)}
              disabled={lookupLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              Find
            </button>
          </div>
          {isLocalhost ? (
            <button
              type="button"
              onClick={loadLocalExample}
              className="mt-3 inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              Load localhost example
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Registration details</h3>
        {lookupLoading ? (
          <p className="text-sm text-gray-600">Loading attendee information…</p>
        ) : resolvedRegistration ? (
          <div className="space-y-6 text-sm">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Attendee name</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                {`${resolvedRegistration.first_name || ""} ${resolvedRegistration.last_name || ""}`.trim() ||
                  "—"}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-8">
              <DetailRow
                label="Registration ID"
                value={<span className="font-mono text-[13px]">{resolvedRegistration.id || "—"}</span>}
              />
              <DetailRow label="Email" value={resolvedRegistration.email || "—"} />
              <DetailRow
                label="Ticket"
                value={
                  REGISTRATION_TICKET_LABELS[resolvedRegistration.ticket_type] ||
                  resolvedRegistration.ticket_type ||
                  "—"
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow
                label="Accompanying guests"
                value={Number(resolvedRegistration.accompanying_count || 0)}
                emphasized
              />
              <DetailRow
                label="Invited speaker"
                value={Number(resolvedRegistration.is_invited_speaker || 0) === 1 ? "Yes" : "No"}
                emphasized
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <EventStatusCard
                title="Welcome reception"
                attending={Number(resolvedRegistration.opening_reception_attending || 0) === 1}
              />
              <EventStatusCard
                title="Gala dinner"
                attending={Number(resolvedRegistration.gala_dinner_attending || 0) === 1}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <MealCard
                title="Lunch selections"
                value={(() => {
                  const lunch = getMealDisplayRows(normalizeWeekendMealDayList(
                    resolvedRegistration.lunch_days,
                  ));
                  return lunch;
                })()}
              />
              <MealCard
                title="Breakfast selections"
                value={(() => {
                  const breakfast = getMealDisplayRows(registrationBreakfastDaysForDisplay(
                    resolvedRegistration,
                  ));
                  return breakfast;
                })()}
              />
            </div>
          </div>
        ) : scannerError || lastAttemptedId ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {scannerError || `Registration "${lastAttemptedId}" not found.`}
          </p>
        ) : (
          <p className="text-sm text-gray-500">No registration has been looked up yet.</p>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, emphasized = false }) {
  return (
    <p
      className={`leading-relaxed ${emphasized ? "rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2" : ""}`}
    >
      <span
        className={`block font-semibold uppercase tracking-wide ${emphasized ? "text-sm text-indigo-700" : "text-xs text-gray-500"}`}
      >
        {label}
      </span>
      <span className={`block text-gray-900 ${emphasized ? "mt-1 text-2xl font-bold" : "mt-0.5 text-sm"}`}>
        {value}
      </span>
    </p>
  );
}

function MealCard({ title, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      {value.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((item) => (
            <div key={item.key} className="rounded-md border border-indigo-200 bg-white px-3 py-2">
              <p className="text-sm font-semibold text-gray-900">{item.day}</p>
              <p className="text-xs text-gray-600">{item.date}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm font-medium text-gray-500">Not selected</p>
      )}
    </div>
  );
}

function AttendanceBadge({ attending, large = false }) {
  const sizeClasses = large ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs";
  if (attending) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 font-semibold text-emerald-700 ${sizeClasses}`}
      >
        Attending
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border border-rose-200 bg-rose-50 font-semibold text-rose-700 ${sizeClasses}`}
    >
      Not attending
    </span>
  );
}

function EventStatusCard({ title, attending }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2">
        <AttendanceBadge attending={attending} large />
      </p>
    </div>
  );
}

function minQrBoxSize() {
  if (typeof window === "undefined") return 250;
  const w = Math.min(window.innerWidth - 64, 400);
  return Math.max(200, Math.floor(w * 0.75));
}
