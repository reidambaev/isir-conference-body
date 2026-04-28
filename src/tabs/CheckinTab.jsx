import React, { useCallback, useEffect, useRef, useState } from "react";
import { CONGRESS_WEEKEND_MEAL_KEYS, formatCongressMealDayList } from "../config/constants";

const CHECKIN_READER_ID = "checkin-html5-qrcode";

const REGISTRATION_TICKET_LABELS = {
  "isir-member": "ISIR Member",
  "non-member": "Non-Member",
  "trainee-member": "Trainee / Student Member",
  "trainee-non-member": "Trainee / Student Non-Member",
  "invited-speaker": "Invited Speaker",
  "korea-day-pass": "Daypass (Korean locals only)",
};

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

export default function CheckinTab() {
  const [lookupLoading, setLookupLoading] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("idle");
  const [scannerError, setScannerError] = useState("");
  const [manualRegistrationId, setManualRegistrationId] = useState("");
  const [scannedValue, setScannedValue] = useState("");
  const [resolvedRegistration, setResolvedRegistration] = useState(null);
  const [lastAttemptedId, setLastAttemptedId] = useState("");

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Badge check-in</h1>
        <p className="text-gray-600 mt-1">
          Scan the QR on the confirmation PDF or type the registration ID below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Camera</h3>
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
            <p className="mt-3 text-sm text-red-600">{scannerError}</p>
          ) : null}
          {scannedValue ? (
            <p className="mt-2 text-xs text-gray-500 break-words">
              Scanned: {scannedValue}
            </p>
          ) : null}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Manual lookup</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualRegistrationId}
              onChange={(e) => setManualRegistrationId(e.target.value)}
              placeholder="Paste registration ID or scanned text"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Result</h3>
        {lookupLoading ? (
          <p className="text-gray-600">Loading…</p>
        ) : resolvedRegistration ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <p>
              <span className="text-gray-500">Registration ID:</span>{" "}
              <span className="font-mono">{resolvedRegistration.id}</span>
            </p>
            <p>
              <span className="text-gray-500">Name:</span>{" "}
              {`${resolvedRegistration.first_name || ""} ${resolvedRegistration.last_name || ""}`.trim() ||
                "—"}
            </p>
            <p>
              <span className="text-gray-500">Email:</span>{" "}
              {resolvedRegistration.email || "—"}
            </p>
            <p>
              <span className="text-gray-500">Ticket:</span>{" "}
              {REGISTRATION_TICKET_LABELS[resolvedRegistration.ticket_type] ||
                resolvedRegistration.ticket_type ||
                "—"}
            </p>
            <p>
              <span className="text-gray-500">Accompanying:</span>{" "}
              {Number(resolvedRegistration.accompanying_count || 0)}
            </p>
            <p>
              <span className="text-gray-500">Invited speaker:</span>{" "}
              {Number(resolvedRegistration.is_invited_speaker || 0) === 1
                ? "Yes"
                : "No"}
            </p>
            <p>
              <span className="text-gray-500">Opening reception:</span>{" "}
              {Number(resolvedRegistration.opening_reception_attending || 0) ===
              1
                ? "Attending"
                : "Not attending"}
            </p>
            <p>
              <span className="text-gray-500">Gala dinner:</span>{" "}
              {Number(resolvedRegistration.gala_dinner_attending || 0) === 1
                ? "Attending"
                : "Not attending"}
            </p>
            <p className="md:col-span-2">
              <span className="text-gray-500">Lunch:</span>{" "}
              {(() => {
                const lunch = normalizeWeekendMealDayList(
                  resolvedRegistration.lunch_days,
                );
                return lunch.length
                  ? formatCongressMealDayList(lunch)
                  : "Not selected";
              })()}
            </p>
            <p className="md:col-span-2">
              <span className="text-gray-500">Breakfast:</span>{" "}
              {(() => {
                const breakfast = registrationBreakfastDaysForDisplay(
                  resolvedRegistration,
                );
                return breakfast.length
                  ? formatCongressMealDayList(breakfast)
                  : "Not selected";
              })()}
            </p>
          </div>
        ) : scannerError || lastAttemptedId ? (
          <p className="text-red-600">
            {scannerError || `Registration "${lastAttemptedId}" not found.`}
          </p>
        ) : (
          <p className="text-gray-500">Nothing looked up yet.</p>
        )}
      </div>
    </div>
  );
}

function minQrBoxSize() {
  if (typeof window === "undefined") return 250;
  const w = Math.min(window.innerWidth - 64, 400);
  return Math.max(200, Math.floor(w * 0.75));
}
