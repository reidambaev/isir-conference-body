import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONGRESS_WEEKEND_MEAL_KEYS, formatCongressMealDayList } from "../config/constants";

const REGISTRATION_TICKET_LABELS = {
  "isir-member": "ISIR Member",
  "non-member": "Non-Member",
  "trainee-member": "Trainee / Student Member",
  "trainee-non-member": "Trainee / Student Non-Member",
  "invited-speaker": "Invited Speaker",
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
  const [adminToken, setAdminToken] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("idle");
  const [scannerError, setScannerError] = useState("");
  const [manualRegistrationId, setManualRegistrationId] = useState("");
  const [lastResolvedRegistrationId, setLastResolvedRegistrationId] = useState("");
  const [scannedValue, setScannedValue] = useState("");

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const registrationsById = useMemo(() => {
    const m = new Map();
    (registrations || []).forEach((r) => {
      if (r?.id) m.set(String(r.id).trim(), r);
    });
    return m;
  }, [registrations]);

  const resolvedRegistration = useMemo(() => {
    const id = String(lastResolvedRegistrationId || "").trim();
    if (!id) return null;
    return registrationsById.get(id) || null;
  }, [lastResolvedRegistrationId, registrationsById]);

  const stopScanner = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (cameraStreamRef.current) {
      for (const track of cameraStreamRef.current.getTracks()) {
        track.stop();
      }
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerStatus("idle");
  }, []);

  useEffect(() => {
    return () => stopScanner();
  }, [stopScanner]);

  const fetchRegistrations = async () => {
    if (!adminToken.trim()) {
      alert("Please enter the admin token first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/registrations", {
        headers: { "X-Admin-Token": adminToken.trim() },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to load registrations");
      }
      setRegistrations(json.data || []);
      setScannerError("");
    } catch (err) {
      setScannerError(err?.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const extractRegistrationIdFromScan = useCallback((text) => {
    const raw = String(text || "").trim();
    if (!raw) return "";
    const lineMatch = raw.match(/Registration ID:\s*([^\n\r]+)/i);
    if (lineMatch?.[1]) return lineMatch[1].trim();
    return raw;
  }, []);

  const resolveAndShowRegistration = useCallback(
    (rawText) => {
      const extractedId = extractRegistrationIdFromScan(rawText);
      setScannedValue(String(rawText || ""));
      setLastResolvedRegistrationId(extractedId);
      if (!extractedId) {
        setScannerError("Could not read a registration ID from that scan.");
        return;
      }
      if (!registrationsById.has(extractedId)) {
        setScannerError(`Registration "${extractedId}" not found.`);
      } else {
        setScannerError("");
      }
    },
    [extractRegistrationIdFromScan, registrationsById],
  );

  const startScanner = useCallback(async () => {
    setScannerError("");
    setScannedValue("");

    if (!("BarcodeDetector" in window)) {
      setScannerStatus("unsupported");
      setScannerError("This browser does not support camera QR scanning.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      setScannerStatus("running");
      scanIntervalRef.current = setInterval(async () => {
        try {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          const codes = await detector.detect(videoRef.current);
          if (codes?.length && codes[0]?.rawValue) {
            resolveAndShowRegistration(codes[0].rawValue);
            stopScanner();
          }
        } catch {
          // ignore transient frame-level errors
        }
      }, 450);
    } catch (err) {
      setScannerStatus("error");
      setScannerError(
        err?.message ||
          "Unable to access camera. Check permissions, then try again.",
      );
      stopScanner();
    }
  }, [resolveAndShowRegistration, stopScanner]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Badge QR Check-In</h1>
        <p className="text-gray-600 mt-1">
          Scan a registration QR code and view attendee details on-screen. This
          uses a live camera stream only and does not save photos to the device.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="min-w-[20rem] flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin token
            </label>
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Enter admin token"
            />
          </div>
          <button
            type="button"
            onClick={fetchRegistrations}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Load Registrations"}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Loaded registrations: {registrations.length}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Live scanner</h3>
          <div className="rounded-lg overflow-hidden bg-gray-900 aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={startScanner}
              disabled={scannerStatus === "running" || registrations.length === 0}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-60"
            >
              {scannerStatus === "running" ? "Scanning..." : "Start scanner"}
            </button>
            <button
              type="button"
              onClick={stopScanner}
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
              Last scan: {scannedValue}
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
              onClick={() => resolveAndShowRegistration(manualRegistrationId)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Find
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Check-in result</h3>
        {!lastResolvedRegistrationId ? (
          <p className="text-gray-500">No registration scanned yet.</p>
        ) : !resolvedRegistration ? (
          <p className="text-red-600">
            Registration <span className="font-mono">{lastResolvedRegistrationId}</span>{" "}
            not found.
          </p>
        ) : (
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
            <p className="md:col-span-2">
              <span className="text-gray-500">Lunch:</span>{" "}
              {(() => {
                const lunch = normalizeWeekendMealDayList(
                  resolvedRegistration.lunch_days,
                );
                return lunch.length ? formatCongressMealDayList(lunch) : "Not selected";
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
        )}
      </div>
    </div>
  );
}
