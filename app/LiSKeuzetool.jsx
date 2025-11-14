'use client';

import React, { useEffect, useMemo, useState } from "react";

const TRACKS = {
  A: { label: "NPI Engineer" },
  B: { label: "Product Engineer" },
  C: { label: "CNC Operator" },
};

const ALL_MODULES = [
  { key: "designForMfg", label: "Design for Manufacturing (A)", tracks: ["A"] },
  { key: "ip", label: "Intellectueel eigendom (A+B)", tracks: ["A", "B"] },
  { key: "scale", label: "Ontwerp voor schaalbaarheid (A+B)", tracks: ["A", "B"] },
  { key: "teamwork", label: "Effectief samenwerken in technische projecten (A+B+C)", tracks: ["A", "B", "C"] },
  { key: "costControl", label: "Kostenbeheersing in productie (A)", tracks: ["A"] },
  { key: "validation", label: "Procesvalidatie en kwaliteitsverbetering (A+B+C)", tracks: ["A", "B", "C"] },
  { key: "deadlines", label: "Werken met strakke deadlines (A)", tracks: ["A"] },
  { key: "feedback", label: "Feedbackgedreven ontwikkeling (A+B+C)", tracks: ["A", "B", "C"] },
  { key: "cmm", label: "CMM meten en controleren (C)", tracks: ["C"] },
  { key: "cncAuto", label: "CNC automation (C)", tracks: ["C"] },
  { key: "ncProg", label: "NC programmeren (C)", tracks: ["C"] },
  { key: "materials", label: "Technische materiaalkeuze (B)", tracks: ["B"] },
  { key: "iso", label: "ISO9000 en CE (A+B)", tracks: ["A", "B"] },
];

const LIS_BASE = "https://www.lis.nl/lis-voor-werkenden-maatwerkprogramma-s-hightechsector/programma-aanbod/";
const LIS_FILTER_BASE = LIS_BASE + "?filter=losse-modules:";

const STORAGE_KEY = "lis-keuzetool-state-v1";
const HISTORY_KEY = "lis-keuzetool-history-v1";

const stripParens = (label) => label.replace(/\s*\([^)]*\)\s*/g, "").trim();

function slugifyModuleLabel(label) {
  const noParens = stripParens(label);
  return noParens
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function makeLisFilterUrl(noModules) {
  if (!noModules || noModules.length === 0) return LIS_BASE;
  const slugs = noModules.map((m) => slugifyModuleLabel(typeof m === "string" ? m : m.label));
  return LIS_FILTER_BASE + slugs.join(",");
}

function formatBulleted(labels) {
  return labels.filter(Boolean).join("\n  - ");
}

function encodeAdviceForUrl(obj) {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  } catch {
    return "";
  }
}

function decodeAdviceFromUrl(str) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
  } catch {
    return null;
  }
}

export default function LiSKeuzetool() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [background, setBackground] = useState("");
  const [role, setRole] = useState("");
  const [interests, setInterests] = useState([]);
  const [competences, setCompetences] = useState({});
  const [wantsContact, setWantsContact] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [adviceHistory, setAdviceHistory] = useState([]);
  const [isComposing, setIsComposing] = useState(false);
  const [dots, setDots] = useState(0);

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.name) setName(saved.name);
        if (saved.email) setEmail(saved.email);
        if (saved.background) setBackground(saved.background);
        if (saved.role) setRole(saved.role);
        if (Array.isArray(saved.interests)) setInterests(saved.interests);
      }
      const hist = localStorage.getItem(HISTORY_KEY);
      if (hist) setAdviceHistory(JSON.parse(hist));
    } catch {}

    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("advice");
    if (encoded) {
      const data = decodeAdviceFromUrl(encoded);
      if (data) {
        setName(data.name || "");
        setEmail(data.email || "");
        setBackground(data.background || "");
        setRole(data.role || "");
        if (Array.isArray(data.interests)) setInterests(data.interests);
        if (Array.isArray(data.modules)) {
          const map = {};
          data.modules.forEach((m) => {
            if (m && m.key) map[m.key] = m.answer;
          });
          setCompetences(map);
        }
        setWantsContact(typeof data.wantsContact === "boolean" ? data.wantsContact : null);
        setStep(4);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ name, email, background, role, interests })
      );
    } catch {}
  }, [name, email, background, role, interests]);

  // animatie voor de "Je advies wordt samengesteld..." tekst
  useEffect(() => {
    if (!isComposing) return;
    const id = setInterval(() => {
      setDots((d) => (d + 1) % 4); // 0–3
    }, 500);
    return () => clearInterval(id);
  }, [isComposing]);

  const composingText = useMemo(() => {
    if (!isComposing) return "";
    const count = dots === 0 ? 1 : dots; // altijd minimaal 1 punt
    const base = "Even geduld, je advies wordt samengesteld";
    return base + ".".repeat(count);
  }, [isComposing, dots]);

  const filteredModules = useMemo(() => {
    const picked = Array.isArray(interests) ? interests : [];
    if (picked.length === 0) return [];
    return ALL_MODULES.filter(
      (m) => Array.isArray(m.tracks) && m.tracks.some((t) => picked.includes(t))
    );
  }, [interests]);

  const handledModulesYes = useMemo(
    () => filteredModules.filter((m) => competences[m.key] === true),
    [filteredModules, competences]
  );

  const handledModulesNo = useMemo(
    () => filteredModules.filter((m) => competences[m.key] === false),
    [filteredModules, competences]
  );

  const canGoStep1 = useMemo(
    () => name.trim() && /.+@.+\..+/.test(email),
    [name, email]
  );

  const canGoStep2 = useMemo(
    () => filteredModules.length > 0,
    [filteredModules]
  );

  const canShowAdvice = useMemo(
    () => wantsContact !== null,
    [wantsContact]
  );

  function toggleInterest(code) {
    setInterests((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.includes(code)) return list.filter((c) => c !== code);
      if (list.length >= 2) return list;
      return [...list, code];
    });
  }

  function setCompetenceFor(moduleKey, value) {
    setCompetences((p) => ({ ...p, [moduleKey]: value }));
  }

  function toStep(n) {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const dynamicLisUrl = useMemo(
    () => makeLisFilterUrl(handledModulesNo),
    [handledModulesNo]
  );

  function buildAdviceText() {
    const yes = formatBulleted(
      handledModulesYes.map((m) => stripParens(m.label))
    );
    const no = formatBulleted(
      handledModulesNo.map((m) => stripParens(m.label))
    );

    return `Persoonlijk Advies\n\n1. Persoonlijke gegevens\n• Naam: ${name}\n• Datum advies: ${today}\n${
      background.trim() ? `• Achtergrond: ${background.trim()}\n` : ""
    }• Wat is je huidige functie: ${role}\n\n2. Overzicht carrière kansen\n• Ik beheers:\n  - ${
      yes || "(geen ingevulde JA-antwoorden)"
    }\n• Ik wil leren:\n  - ${
      no || "(geen ingevulde NEE-antwoorden)"
    }\n\n3. Link\n• ${dynamicLisUrl}`;
  }

  function buildAdviceObject() {
    return {
      name,
      email,
      background: background.trim() || null,
      role,
      interests,
      modules: filteredModules.map((m) => ({
        key: m.key,
        label: m.label,
        answer: competences[m.key],
      })),
      wantsContact,
      adviceDate: today,
      advicePlain: buildAdviceText(),
    };
  }

  function buildAdviceHtml() {
    const clean = (s) => (s || "").replace(/</g, "&lt;");
    const yes = handledModulesYes
      .map((m) => `<li>${clean(stripParens(m.label))}</li>`)
      .join("");
    const no = handledModulesNo
      .map((m) => `<li>${clean(stripParens(m.label))}</li>`)
      .join("");
    const url = makeLisFilterUrl(handledModulesNo);

    return `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111;">
        <h2 style="margin:0 0 12px 0; font-size:20px;">Persoonlijk Advies</h2>
        <h3 style="margin:16px 0 8px 0; font-size:16px;">1. Persoonlijke gegevens</h3>
        <p style="margin:4px 0;">Naam: <strong>${clean(name)}</strong></p>
        <p style="margin:4px 0;">Datum advies: <strong>${clean(today)}</strong></p>
        ${
          background.trim()
            ? `<p style="margin:4px 0;">Achtergrond: ${clean(background)}</p>`
            : ""
        }
        <p style="margin:4px 0;">Wat is je huidige functie: <strong>${clean(
          role
        )}</strong></p>
        <h3 style="margin:16px 0 8px 0; font-size:16px;">2. Overzicht carrière kansen</h3>
        <div style="display:flex; gap:24px;">
          <div>
            <p style="margin:4px 0 8px 0;"><strong>Ik beheers</strong></p>
            <ul>${
              yes ||
              '<li style="color:#666">(geen ingevulde JA-antwoorden)</li>'
            }</ul>
          </div>
          <div>
            <p style="margin:4px 0 8px 0;"><strong>Ik wil leren</strong></p>
            <ul>${
              no ||
              '<li style="color:#666">(geen ingevulde NEE-antwoorden)</li>'
            }</ul>
          </div>
        </div>
        <p style="margin:16px 0;">Geselecteerde modules op de website: <a href="${url}" target="_blank" rel="noreferrer">${url}</a></p>
        <hr style="margin:24px 0; border:none; border-top:1px solid #eee;"/>
        <p style="margin:0 0 4px 0; font-weight:600;">Leidse instrumentmakers School</p>
        <p style="margin:0;">Einsteinweg 61<br/>2333 CC Leiden<br/>Nederland</p>
        <p style="margin:8px 0 0 0;">071-5681168<br/>info@lis.nl<br/><a href="https://www.lis.nl" target="_blank" rel="noreferrer">www.lis.nl</a></p>
      </div>`;
  }

  async function sendToRob() {
    setIsComposing(true);
    setStatusMsg("");
    const adviceObj = buildAdviceObject();
    try {
      const res = await fetch("/api/send-lis-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adviceObj),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusMsg(
          `Verzenden mislukt: ${data?.error || res.statusText} (${data?.code || res.status})`
        );
        return true;
      }
      setStatusMsg("Uw advies is opgeslagen");
      return true;
    } catch (e) {
      setStatusMsg(`Verzenden mislukt (network): ${e.message}`);
      return true;
    } finally {
      setIsComposing(false);
      setDots(0);
    }
  }

  async function emailVisitor() {
    const adviceObj = buildAdviceObject();
    const html = buildAdviceHtml();
    setStatusMsg("Advies mailen naar bezoeker…");
    try {
      const res = await fetch("/api/send-lis-advice-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: `Uw persoonlijk LiS-advies – ${adviceObj.name || "Bezoeker"}`,
          html,
          text: adviceObj.advicePlain,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusMsg(
          `Mailen naar bezoeker mislukt: ${data?.error || res.statusText}`
        );
        return;
      }
      setStatusMsg("Advies gemaild naar jouw e-mailadres.");
    } catch (e) {
      setStatusMsg(`Mailen naar bezoeker mislukt (network): ${e.message}`);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#3489c2" }}>
      <header className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold text-black">
          Keuzetool LiS voor Werkenden
        </h1>
        <p className="mt-2 text-white">
          Beantwoord enkele vragen en ontvang een persoonlijk advies met modules
          van de Leidse instrumentmakers School.
        </p>
        {/* Voortgangsbalk */}
        <div className="mt-4 h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
        {!!statusMsg && (
          <p className="text-sm mt-2 text-white" role="status">
            {statusMsg}
          </p>
        )}
        {isComposing && (
          <p className="text-sm mt-1 text-white">
            {composingText}
          </p>
        )}
      </header>

      <main className="mx-auto max-w-4xl bg-white rounded-2xl shadow-lg p-8">
        {step === 1 && (
          <section>
            <h2 className="text-xl font-semibold text-black mb-2">
              1. Persoonlijke gegevens
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-black">
                  Naam <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Voornaam Achternaam"
                  className="mt-1 border rounded-lg p-2"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-black">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="naam@voorbeeld.nl"
                  className="mt-1 border rounded-lg p-2"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-black">
                  Datum advies
                </label>
                <input
                  type="text"
                  value={today}
                  readOnly
                  className="mt-1 border rounded-lg p-2 bg-gray-50"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-black">
                  Wat is je huidige functie?
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Bijv. Productie-operator"
                  className="mt-1 border rounded-lg p-2"
                />
              </div>
              <div className="md:col-span-2 flex flex-col">
                <label className="text-sm font-medium text-black">
                  Achtergrond
                  <span className="text-gray-500 font-normal">
                    {" "}(optioneel, max. 250 woorden)
                  </span>
                </label>
                <textarea
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="Vertel iets over je achtergrond, sector/branche, ervaring, etc."
                  className="mt-1 border rounded-lg p-2 min-h-[120px]"
                  maxLength={2000}
                />
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-black mb-2">
                Geïnteresseerd in (kies maximaal 2):
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TRACKS).map(([code, { label }]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleInterest(code)}
                    className={`px-3 py-2 rounded-2xl border text-sm transition-colors duration-300 ${
                      Array.isArray(interests) && interests.includes(code)
                        ? "bg-[#3489c2] text-white border-[#3489c2] hover:bg-black"
                        : "bg-white border-gray-300 hover:bg-black hover:text-white"
                    }`}
                    disabled={
                      !Array.isArray(interests)
                        ? false
                        : !interests.includes(code) && interests.length >= 2
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                className={`px-5 py-2 rounded-xl text-white shadow transition-colors duration-300 ${
                  canGoStep1
                    ? "bg-[#3489c2] hover:bg-black"
                    : "bg-[#3489c2]/50 cursor-not-allowed"
                }`}
                disabled={!canGoStep1}
                onClick={() => toStep(2)}
              >
                Start keuzetool
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h2 className="text-xl font-semibold text-black mb-2">
              2. Startpunt keuzetool
            </h2>
            <p className="text-gray-600 mb-4">
              Geef per module aan of je deze beheerst.
            </p>
            {filteredModules.length === 0 && (
              <p className="text-gray-600">
                Geen modules om te tonen. Ga terug en kies één of twee interesses.
              </p>
            )}
            <ul className="space-y-3">
              {filteredModules.map((m) => (
                <li
                  key={m.key}
                  className="flex items-center justify-between gap-4 border rounded-xl p-3"
                >
                  <div>
                    <p className="font-medium text-black">
                      {stripParens(m.label)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Deze regel geeft een korte omschrijving over bovengenoemde
                      onderwerp.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCompetenceFor(m.key, true)}
                      className={`px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        competences[m.key] === true
                          ? "bg-[#3489c2] border-[#3489c2] text-white hover:bg-black"
                          : "bg-white border-gray-300 hover:bg-black hover:text-white"
                      }`}
                      aria-pressed={competences[m.key] === true}
                    >
                      Ja
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompetenceFor(m.key, false)}
                      className={`px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        competences[m.key] === false
                          ? "bg-[#3489c2] border-[#3489c2] text-white hover:bg-black"
                          : "bg-white border-gray-300 hover:bg-black hover:text-white"
                      }`}
                      aria-pressed={competences[m.key] === false}
                    >
                      Nee
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center gap-3">
              <button
                className="px-4 py-2 rounded-xl border transition-colors duration-300 hover:bg-black hover:text-white"
                onClick={() => toStep(1)}
              >
                Terug
              </button>
              <button
                className={`px-5 py-2 rounded-xl text-white shadow transition-colors duration-300 ${
                  canGoStep2
                    ? "bg-[#3489c2] hover:bg-black"
                    : "bg-[#3489c2]/50 cursor-not-allowed"
                }`}
                disabled={!canGoStep2}
                onClick={() => toStep(3)}
              >
                Verder
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h2 className="text-xl font-semibold text-black mb-2">
              3. Aanvullende vragen
            </h2>
            <p className="mb-4 text-black">
              Bedankt voor het invullen! Wil je persoonlijk en vrijblijvend
              contact/advies van de LiS?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={`px-3 py-2 rounded-xl border transition-colors duration-300 ${
                  wantsContact === true
                    ? "bg-[#3489c2] border-[#3489c2] text-white hover:bg-black"
                    : "bg-white border-gray-300 hover:bg-black hover:text-white"
                }`}
                onClick={() => setWantsContact(true)}
              >
                Ja, graag
              </button>
              <button
                type="button"
                className={`px-3 py-2 rounded-xl border transition-colors duration-300 ${
                  wantsContact === false
                    ? "bg-[#3489c2] border-[#3489c2] text-white hover:bg-black"
                    : "bg-white border-gray-300 hover:bg-black hover:text-white"
                }`}
                onClick={() => setWantsContact(false)}
              >
                Nee, niet nodig
              </button>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                className="px-4 py-2 rounded-xl border transition-colors duration-300 hover:bg-black hover:text-white"
                onClick={() => toStep(2)}
              >
                Terug
              </button>
              <button
                className={`px-5 py-2 rounded-xl text-white shadow transition-colors duration-300 ${
                  canShowAdvice
                    ? "bg-[#3489c2] hover:bg-black"
                    : "bg-[#3489c2]/50 cursor-not-allowed"
                }`}
                disabled={!canShowAdvice}
                onClick={async () => {
                  const ok = await sendToRob();
                  if (ok) toStep(4);
                }}
              >
                Toon mij advies
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h2 className="text-xl font-semibold text-black mb-2">
              4. Persoonlijk Advies
            </h2>
            <div className="border rounded-2xl p-5 bg-gray-50">
              <h3 className="text-lg font-semibold text-black mb-3">
                1. Persoonlijke gegevens
              </h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-600">Naam</dt>
                  <dd className="font-medium text-black">{name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Datum advies</dt>
                  <dd className="font-medium text-black">{today}</dd>
                </div>
                {background.trim() && (
                  <div className="md:col-span-2">
                    <dt className="text-sm text-gray-600">Achtergrond</dt>
                    <dd className="font-medium whitespace-pre-wrap text-black">
                      {background}
                    </dd>
                  </div>
                )}
                <div className="md:col-span-2">
                  <dt className="text-sm text-gray-600">
                    Wat is je huidige functie
                  </dt>
                  <dd className="font-medium text-black">{role}</dd>
                </div>
              </dl>
            </div>

            <div className="border rounded-2xl p-5 bg-gray-50 mt-6">
              <h3 className="text-lg font-semibold text-black mb-3">
                2. Overzicht carrière kansen
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="font-medium text-black mb-2">Ik beheers</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {handledModulesYes.length > 0 ? (
                      handledModulesYes.map((m) => (
                        <li key={m.key} className="text-black">
                          {stripParens(m.label)}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">
                        (geen ingevulde JA-antwoorden)
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-black mb-2">Ik wil leren</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {handledModulesNo.length > 0 ? (
                      handledModulesNo.map((m) => (
                        <li key={m.key} className="text-black">
                          {stripParens(m.label)}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">
                        (geen ingevulde NEE-antwoorden)
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={dynamicLisUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-xl border transition-colors duration-300 hover:bg-black hover:text-white"
              >
                Bezoek de website en bekijk het voor u geselecteerd aanbod
              </a>
              <button
                className="px-5 py-2 rounded-xl border transition-colors duration-300 hover:bg-black hover:text-white"
                onClick={() => {
                  try {
                    const next = [...adviceHistory, buildAdviceObject()];
                    setAdviceHistory(next);
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
                  } catch {}
                  toStep(1);
                }}
              >
                Nieuw advies starten
              </button>
              <button
                className="px-5 py-2 rounded-xl border transition-colors duration-300 hover:bg-black hover:text-white"
                onClick={emailVisitor}
              >
                Mail mijn persoonlijk advies
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
