const DATA = require("../assets/data/conditions.json");
const SYMPTOM_MAP = {
  face: ["acne-rosacea", "eczema-dermatitis", "vascular"],
  spot: ["pigment", "birthmark"],
  hair: ["hair-loss"],
  itch: ["eczema-dermatitis", "fungal", "infection"],
  foot: ["keratinization", "fungal", "warts"],
  nail: ["fungal"],
  birthmark: ["birthmark", "pigment"],
  postprocedural: ["aesthetic-complication", "keratinization"],
};

console.log("=== Symptom filter (each symptom → count) ===");
Object.keys(SYMPTOM_MAP).forEach(sym => {
  const cats = SYMPTOM_MAP[sym];
  const r = DATA.filter(c => cats.includes(c.category));
  console.log(sym.padEnd(16), "->", r.length, "篇  [" + r.map(c => c.id).join(",") + "]");
});

console.log("\n=== Category filter (脱发问题) ===");
const hair = DATA.filter(c => c.category === "hair-loss");
console.log("hair-loss:", hair.length, "篇 ->", hair.map(c => c.id).join(","));

console.log('\n=== Search "脱" ===');
const s = "脱";
const r2 = DATA.filter(c =>
  (c.title + " " + (c.keywords || []).join(" ") + " " + c.summary).toLowerCase().includes(s)
);
console.log("matches:", r2.length, "->", r2.map(c => c.id).join(","));

console.log("\n=== Coverage: every condition has valid category ===");
const validCats = Object.keys({
  "acne-rosacea": 1, pigment: 1, birthmark: 1, keratinization: 1,
  "eczema-dermatitis": 1, fungal: 1, warts: 1, "hair-loss": 1,
  vascular: 1, "benign-tumor": 1, infection: 1, "aesthetic-complication": 1, "sweat-misc": 1,
});
const bad = DATA.filter(c => !validCats.includes(c.category));
console.log(bad.length ? "INVALID: " + bad.map(c => c.id).join(",") : "all 55 valid");

console.log("\n=== Coverage: every condition reachable by ≥1 symptom or searchable ===");
const noSym = DATA.filter(c => !c.symptoms || c.symptoms.length === 0).map(c => c.id);
console.log("no symptom tag:", noSym.length, "->", noSym.join(",") || "none");
