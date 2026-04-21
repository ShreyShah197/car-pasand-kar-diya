import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_BASE;

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════ */
const BODY_TYPES = ["Hatchback", "Sedan", "SUV", "MPV", "EV"];
const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid"];
const USE_CASES = ["Daily Commute", "Family Road Trips", "Off-Roading", "City + Highway", "First Car"];
const PRIORITIES = ["Safety", "Mileage", "Features", "Performance", "Resale Value"];

/* ═══════════════════════════════════════════════════════════════════════
   ICONS (inline SVG helpers)
   ═══════════════════════════════════════════════════════════════════════ */
const CarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM3 11l1.5-5A2 2 0 016.4 4.5h11.2A2 2 0 0119.5 6L21 11M3 11v6h2m16-6v6h-2" />
  </svg>
);
const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3 2l18 10-18 10 3-10zm0 0h8" />
  </svg>
);
const ChevronRight = () => (
  <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);
const StarIcon = () => (
  <svg className="w-4 h-4 text-yellow-400 inline" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.065 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════
   TYPEWRITER HOOK
   ═══════════════════════════════════════════════════════════════════════ */
function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

/* ═══════════════════════════════════════════════════════════════════════
   CHIP COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
function Chip({ label, selected, onClick }) {
  return (
    <button
      className={`chip ${selected ? "active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CAR CARD (compact — for chat)
   ═══════════════════════════════════════════════════════════════════════ */
function CarCardMini({ car }) {
  return (
    <div className="bg-surface-light border border-white/5 rounded-xl p-4 flex flex-col gap-1 animate-fade-up">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{car.make} {car.model}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-light font-medium">
          ₹{car.price_lakh}L
        </span>
      </div>
      <span className="text-xs text-slate-400">{car.variant}</span>
      <div className="flex flex-wrap gap-2 mt-1">
        <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-300">{car.fuel_type}</span>
        <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-300">{car.transmission}</span>
        <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-300">{car.body_type}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CAR CARD (detailed — for shortlist)
   ═══════════════════════════════════════════════════════════════════════ */
function CarCardFull({ car, index }) {
  return (
    <div
      className="bg-gradient-to-br from-surface-light to-surface rounded-2xl border border-white/5 overflow-hidden animate-fade-up"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      {/* Header band */}
      <div className="bg-gradient-to-r from-accent/30 to-accent-light/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{car.make} {car.model}</h3>
          <p className="text-sm text-accent-light">{car.variant}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-white">₹{car.price_lakh}<span className="text-sm font-normal text-slate-300"> Lakh</span></p>
        </div>
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
        {[
          { label: "Fuel", value: car.fuel_type },
          { label: "Transmission", value: car.transmission },
          { label: "Seats", value: car.seating },
          { label: car.fuel_type === "Electric" ? "Range (km)" : "Mileage (km/l)", value: car.mileage },
        ].map((s) => (
          <div key={s.label} className="bg-surface px-4 py-3 text-center">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className="text-sm font-semibold text-slate-200 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Safety + Body */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-white/5">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} />
          ))}
          <span className="text-xs text-slate-400 ml-1">{car.safety_rating}/5</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-300">{car.body_type}</span>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 py-4 border-t border-white/5">
        <div>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">✅ Pros</p>
          {(car.pros || "").split(",").map((p, i) => (
            <p key={i} className="text-sm text-slate-300 leading-relaxed">• {p.trim()}</p>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">⚠️ Cons</p>
          {(car.cons || "").split(",").map((c, i) => (
            <p key={i} className="text-sm text-slate-300 leading-relaxed">• {c.trim()}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   AI MESSAGE WITH TYPEWRITER
   ═══════════════════════════════════════════════════════════════════════ */
function AiMessage({ text }) {
  const { displayed, done } = useTypewriter(text, 14);
  return (
    <div className="flex gap-3 items-start animate-fade-up">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shrink-0 mt-0.5">
        <CarIcon />
      </div>
      <div className="bg-surface-light rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] border border-white/5">
        <p className={`text-sm text-slate-200 leading-relaxed whitespace-pre-wrap ${!done ? "cursor-blink" : ""}`}>
          {displayed}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   VIEW 1 — PREFERENCES FORM
   ═══════════════════════════════════════════════════════════════════════ */
function PreferencesView({ onDone }) {
  const [budget, setBudget] = useState(15);
  const [bodyTypes, setBodyTypes] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [useCase, setUseCase] = useState("");
  const [priority, setPriority] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = (arr, setArr, val) =>
    setArr((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: { budget, bodyTypes, fuelTypes, useCase, priority },
        }),
      });
      const session = await res.json();
      onDone(session);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-up">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
          Find Your Perfect Car 🚗
        </h1>
        <p className="text-slate-400 text-base">Tell us what you're looking for and our AI will pick the best matches.</p>
      </div>

      <div className="space-y-8 bg-surface/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6 sm:p-8">
        {/* Budget */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-3 block">
            Budget — <span className="text-accent-light font-bold text-lg">₹{budget} Lakh</span>
          </label>
          <input
            type="range"
            min={3}
            max={50}
            step={0.5}
            value={budget}
            onChange={(e) => setBudget(parseFloat(e.target.value))}
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>₹3L</span>
            <span>₹50L</span>
          </div>
        </div>

        {/* Body Type */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-3 block">Body Type</label>
          <div className="flex flex-wrap gap-2">
            {BODY_TYPES.map((bt) => (
              <Chip key={bt} label={bt} selected={bodyTypes.includes(bt)} onClick={() => toggle(bodyTypes, setBodyTypes, bt)} />
            ))}
          </div>
        </div>

        {/* Fuel Type */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-3 block">Fuel Type</label>
          <div className="flex flex-wrap gap-2">
            {FUEL_TYPES.map((ft) => (
              <Chip key={ft} label={ft} selected={fuelTypes.includes(ft)} onClick={() => toggle(fuelTypes, setFuelTypes, ft)} />
            ))}
          </div>
        </div>

        {/* Use Case */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-3 block">Primary Use Case</label>
          <div className="flex flex-wrap gap-2">
            {USE_CASES.map((uc) => (
              <Chip key={uc} label={uc} selected={useCase === uc} onClick={() => setUseCase(uc === useCase ? "" : uc)} />
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-3 block">Top Priority</label>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <Chip key={p} label={p} selected={priority === p} onClick={() => setPriority(p === priority ? "" : p)} />
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white font-semibold text-base
                     transition-all hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Setting up…" : <>Start Chat <ChevronRight /></>}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   VIEW 2 — CHAT
   ═══════════════════════════════════════════════════════════════════════ */
function ChatView({ session, onShortlist }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: `Hey! 👋 I've noted your preferences. Ask me anything like "Suggest a safe SUV under 20 lakhs" and I'll pick the top 3 cars for you!` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [shortlistCars, setShortlistCars] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, shortlistCars]);

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    setShortlistCars([]);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: session.id, message: msg }),
      });
      const data = await res.json();

      // Add AI reasoning as message
      setMessages((prev) => [...prev, { role: "ai", text: data.reasoning || "Here are my top 3 picks!" }]);

      // Fetch shortlisted car details
      if (data.shortlisted_car_ids?.length) {
        const carsRes = await fetch(`${API}/api/cars/shortlist?ids=${data.shortlisted_car_ids.join(",")}`);
        const cars = await carsRes.json();
        setShortlistCars(cars);

        // Update session
        await fetch(`${API}/api/session/${session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortlisted_car_ids: data.shortlisted_car_ids }),
        });
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai", text: "Oops, something went wrong. Try again!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((m, i) =>
          m.role === "ai" ? (
            <AiMessage key={i} text={m.text} />
          ) : (
            <div key={i} className="flex justify-end animate-fade-up">
              <div className="bg-accent/20 border border-accent/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                <p className="text-sm text-slate-200">{m.text}</p>
              </div>
            </div>
          )
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 items-start animate-fade-up">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shrink-0">
              <CarIcon />
            </div>
            <div className="bg-surface-light rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-light animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-accent-light animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-accent-light animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Shortlist car cards in chat */}
        {shortlistCars.length > 0 && (
          <div className="space-y-3 animate-fade-up">
            <p className="text-xs font-semibold text-accent-light uppercase tracking-wider ml-11">Top 3 Picks</p>
            <div className="grid gap-3 ml-11">
              {shortlistCars.map((car) => (
                <CarCardMini key={car.id} car={car} />
              ))}
            </div>
            <div className="ml-11">
              <button
                onClick={() => onShortlist(shortlistCars)}
                className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-sm font-semibold
                           transition-all hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.97] cursor-pointer"
              >
                View Detailed Comparison <ChevronRight />
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-white/5 bg-surface/80 backdrop-blur-xl px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about cars…"
            disabled={loading}
            className="flex-1 bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200
                       placeholder:text-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30
                       transition-all disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white
                       transition-all hover:shadow-lg hover:shadow-accent/30 active:scale-[0.95] disabled:opacity-40 cursor-pointer"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   VIEW 3 — SHORTLIST
   ═══════════════════════════════════════════════════════════════════════ */
function ShortlistView({ cars, onBack }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Your Shortlist 🏆</h2>
          <p className="text-slate-400 text-sm mt-1">AI-curated top 3 recommendations based on your preferences</p>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-accent-light hover:text-white transition-colors cursor-pointer"
        >
          ← Back to chat
        </button>
      </div>
      <div className="space-y-6">
        {cars.map((car, i) => (
          <CarCardFull key={car.id} car={car} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   APP ROOT
   ═══════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [view, setView] = useState("preferences"); // preferences | chat | shortlist
  const [session, setSession] = useState(null);
  const [shortlistCars, setShortlistCars] = useState([]);

  const handlePreferencesDone = (sess) => {
    setSession(sess);
    setView("chat");
  };

  const handleShortlist = (cars) => {
    setShortlistCars(cars);
    setView("shortlist");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="bg-navy-900/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
              <CarIcon />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Car <span className="text-accent-light">Pasand</span>
            </span>
          </div>

          {/* Step indicators */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            {["Preferences", "Chat", "Shortlist"].map((step, i) => {
              const stepKey = step.toLowerCase();
              const isActive = view === stepKey;
              const isPast =
                (stepKey === "preferences" && (view === "chat" || view === "shortlist")) ||
                (stepKey === "chat" && view === "shortlist");
              return (
                <div key={step} className="flex items-center gap-2">
                  {i > 0 && <div className={`w-8 h-px ${isPast || isActive ? "bg-accent" : "bg-white/10"}`} />}
                  <span
                    className={`px-3 py-1 rounded-full transition-all ${
                      isActive
                        ? "bg-accent/20 text-accent-light font-semibold"
                        : isPast
                        ? "text-accent-light/60"
                        : "text-slate-500"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <main className="flex-1">
        {view === "preferences" && <PreferencesView onDone={handlePreferencesDone} />}
        {view === "chat" && <ChatView session={session} onShortlist={handleShortlist} />}
        {view === "shortlist" && <ShortlistView cars={shortlistCars} onBack={() => setView("chat")} />}
      </main>
    </div>
  );
}
