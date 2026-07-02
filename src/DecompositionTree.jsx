import { useState } from "react";
import { ChevronRight, ChevronDown, Info, Circle } from "lucide-react";

// ---------- Country-level base data ($M) — single source of truth ----------
const LEAVES = [
  { name: "US", bucket: "US", actual: 15200, le: 21300, fyle: 25600, proj: 18200 },
  { name: "GERMANY", bucket: "DE", actual: 650, le: 680, fyle: 815, proj: 780 },
  { name: "FRANCE", bucket: "FR", actual: 805, le: 805, fyle: 966, proj: 966 },
  { name: "SPAIN", bucket: "SP", actual: 300, le: 305, fyle: 366, proj: 305 },
  { name: "ITALY", bucket: "IT", actual: 725, le: 725, fyle: 870, proj: 870 },
  { name: "UNITED KINGDOM", bucket: "UKI", actual: 886, le: 886, fyle: 1100, proj: 1100 },
  { name: "IRELAND", bucket: "UKI", actual: 49, le: 49, fyle: 58, proj: 58 },
  { name: "CANADA", bucket: "CA", actual: 664, le: 694, fyle: 833, proj: 797 },
  { name: "JAPAN", bucket: "JP", actual: 82, le: 82, fyle: 98, proj: 98 },
  { name: "CHINA", bucket: "CN", actual: 15, le: 15, fyle: 18, proj: 18 },
  { name: "AUSTRALIA", bucket: "Rest of ACE", actual: 483, le: 483, fyle: 580, proj: 580 },
  { name: "BELGIUM", bucket: "Rest of ACE", actual: 270, le: 270, fyle: 325, proj: 325 },
  { name: "DENMARK", bucket: "Rest of ACE", actual: 149, le: 149, fyle: 179, proj: 179 },
  { name: "SWEDEN", bucket: "Rest of ACE", actual: 120, le: 120, fyle: 144, proj: 144 },
  { name: "FINLAND", bucket: "Rest of ACE", actual: 90, le: 90, fyle: 108, proj: 108 },
  { name: "NORWAY", bucket: "Rest of ACE", actual: 110, le: 110, fyle: 132, proj: 132 },
  { name: "SWITZERLAND", bucket: "Rest of ACE", actual: 340, le: 340, fyle: 408, proj: 380 },
  { name: "NETHERLANDS", bucket: "Rest of ACE", actual: 250, le: 250, fyle: 300, proj: 300 },
  { name: "AUSTRIA", bucket: "Rest of ACE", actual: 140, le: 140, fyle: 168, proj: 168 },
  { name: "POLAND", bucket: "Rest of ACE", actual: 95, le: 95, fyle: 114, proj: 114 },
  { name: "ISRAEL", bucket: "Rest of ACE", actual: 60, le: 60, fyle: 72, proj: 72 },
  { name: "GREECE", bucket: "Rest of ACE", actual: 40, le: 40, fyle: 48, proj: 48 },
  { name: "PORTUGAL", bucket: "Rest of ACE", actual: 55, le: 55, fyle: 66, proj: 66 },
  { name: "ROMANIA", bucket: "Rest of ACE", actual: 30, le: 30, fyle: 36, proj: 36 },
  { name: "SOUTH KOREA", bucket: "Rest of ICR", actual: 45, le: 45, fyle: 54, proj: 40 },
  { name: "COLOMBIA", bucket: "Rest of ICR", actual: 12, le: 12, fyle: 14, proj: 10 },
  { name: "SINGAPORE", bucket: "Rest of ICR", actual: 38, le: 38, fyle: 46, proj: 46 },
  { name: "TAIWAN", bucket: "Rest of ICR", actual: 22, le: 22, fyle: 26, proj: 26 },
  { name: "KUWAIT", bucket: "Rest of ICR", actual: 8, le: 8, fyle: 10, proj: 10 },
  { name: "MEXICO", bucket: "Rest of ICR", actual: 60, le: 60, fyle: 72, proj: 50 },
  { name: "BRAZIL", bucket: "Rest of ICR", actual: 90, le: 90, fyle: 108, proj: 70 },
  { name: "SAUDI ARABIA", bucket: "Rest of ICR", actual: 35, le: 35, fyle: 42, proj: 42 },
  { name: "UNITED ARAB EMIRATES", bucket: "Rest of ICR", actual: 20, le: 20, fyle: 24, proj: 24 },
  { name: "HONG KONG", bucket: "Rest of ICR", actual: 18, le: 18, fyle: 22, proj: 22 },
  { name: "RUSSIA", bucket: "Rest of ICR", actual: 25, le: 25, fyle: 30, proj: 10 },
  { name: "TURKEY", bucket: "TR", actual: 32, le: 32, fyle: 38, proj: 38 },
];

const BUCKET_ORDER = ["US", "DE", "FR", "SP", "IT", "UKI", "CA", "JP", "CN", "TR", "Rest of ACE", "Rest of ICR"];

const DOT_COLORS = {
  US: "#f59e0b", DE: "#3b82f6", FR: "#ec4899", SP: "#f97316", IT: "#14b8a6",
  UKI: "#8b5cf6", CA: "#ef4444", JP: "#ec4899", CN: "#eab308", TR: "#84cc16",
  "Rest of ACE": "#22c55e", "Rest of ICR": "#a855f7",
  HIV: "#0ea5e9", "ONC ST": "#64748b",
  BIKTARVY: "#0284c7", DESCOVY: "#06b6d4", TRODELVY: "#6366f1", TIBSOVO: "#a855f7",
};

// TA / Brand split (illustrative — shares sum to 1 at each level, applied uniformly)
const TA_STRUCTURE = [
  { ta: "HIV", share: 0.75, brands: [
      { name: "BIKTARVY", share: 0.7 },
      { name: "DESCOVY", share: 0.3 },
    ]},
  { ta: "ONC ST", share: 0.25, brands: [
      { name: "TRODELVY", share: 0.6 },
      { name: "TIBSOVO", share: 0.4 },
    ]},
];

function scaleMetrics(m, factor) {
  return { actual: m.actual * factor, le: m.le * factor, fyle: m.fyle * factor, proj: m.proj * factor };
}
function sumRows(rows) {
  return rows.reduce(
    (acc, r) => ({ actual: acc.actual + r.actual, le: acc.le + r.le, fyle: acc.fyle + r.fyle, proj: acc.proj + r.proj }),
    { actual: 0, le: 0, fyle: 0, proj: 0 }
  );
}

// ================= GEO TREE: Worldwide -> Country -> TA -> Brand =================
function buildBrandLeafNodes(countryMetrics) {
  return TA_STRUCTURE.map((taDef) => {
    const taMetrics = scaleMetrics(countryMetrics, taDef.share);
    const brandNodes = taDef.brands.map((b) => ({
      name: b.name, level: "brand", expandable: false, children: [],
      ...scaleMetrics(taMetrics, b.share),
    }));
    return { name: taDef.ta, level: "ta", expandable: true, children: brandNodes, ...taMetrics };
  });
}
function buildCountryNode(leaf) {
  const metrics = { actual: leaf.actual, le: leaf.le, fyle: leaf.fyle, proj: leaf.proj };
  return { name: leaf.name, level: "country", expandable: true, children: buildBrandLeafNodes(metrics), ...metrics };
}
function buildGeoTree() {
  const buckets = BUCKET_ORDER.map((bucketName) => {
    const countries = LEAVES.filter((l) => l.bucket === bucketName).map(buildCountryNode);
    if (countries.length === 1) {
      const c = countries[0];
      return { ...c, name: bucketName, level: "country" };
    }
    const totals = sumRows(countries);
    return { name: bucketName, level: "bucket", expandable: true, children: countries, ...totals };
  });
  const worldwide = sumRows(buckets);
  return { name: "Worldwide", level: "root", expandable: true, children: buckets, ...worldwide };
}
const GEO_TREE = buildGeoTree();

// ================= TA TREE: Worldwide -> TA -> Brand -> [Countries + Rest of ACE/ICR] =================
function buildBrandGeoBuckets(factor) {
  return BUCKET_ORDER.map((bucketName) => {
    const countriesRaw = LEAVES.filter((l) => l.bucket === bucketName);
    if (countriesRaw.length === 1) {
      const c = countriesRaw[0];
      return { name: bucketName, level: "country", expandable: false, children: [], ...scaleMetrics(c, factor) };
    }
    const countryNodes = countriesRaw.map((c) => ({
      name: c.name, level: "country", expandable: false, children: [], ...scaleMetrics(c, factor),
    }));
    const totals = sumRows(countryNodes);
    return { name: bucketName, level: "bucket", expandable: true, children: countryNodes, ...totals };
  });
}
function buildTaTree() {
  const taNodes = TA_STRUCTURE.map((taDef) => {
    const brandNodes = taDef.brands.map((b) => {
      const factor = taDef.share * b.share;
      const buckets = buildBrandGeoBuckets(factor);
      const totals = sumRows(buckets);
      return { name: b.name, level: "brand", expandable: true, children: buckets, ...totals };
    });
    const taTotals = sumRows(brandNodes);
    return { name: taDef.ta, level: "ta", expandable: true, children: brandNodes, ...taTotals };
  });
  const worldwide = sumRows(taNodes);
  return { name: "Worldwide", level: "root", expandable: true, children: taNodes, ...worldwide };
}
const TA_TREE = buildTaTree();

// ---------- Formatting ----------
function fmt(n) {
  const abs = Math.abs(n);
  if (abs >= 1000) return (n < 0 ? "-$" : "$") + (abs / 1000).toFixed(1) + "B";
  return (n < 0 ? "-$" : "$") + Math.round(abs) + "M";
}
function fmtPct(n) {
  const sign = n > 0 ? "+" : n < 0 ? "" : "+";
  return sign + n.toFixed(1) + "%";
}

function Row({ node, depth, path, isOpen, toggle }) {
  const gap = node.proj - node.fyle;
  const gapPct = node.fyle !== 0 ? (gap / node.fyle) * 100 : 0;
  const positive = gap >= 0;
  const color = DOT_COLORS[node.name];

  return (
    <div
      className={`flex items-center px-6 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
        depth === 0 ? "bg-indigo-50/60" : "hover:bg-gray-50"
      }`}
      style={{ paddingLeft: `${24 + depth * 24}px` }}
      onClick={() => node.expandable && toggle(path)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {node.expandable ? (
          isOpen ? <ChevronDown size={14} className="text-indigo-400 shrink-0" /> : <ChevronRight size={14} className="text-indigo-400 shrink-0" />
        ) : (
          <span className="w-[14px] shrink-0" />
        )}
        {color && <Circle size={8} fill={color} stroke="none" className="shrink-0" />}
        <span
          className={`truncate ${depth === 0 ? "font-bold text-gray-900" : depth === 1 ? "font-semibold text-gray-800" : "text-gray-600"}`}
          style={{ fontSize: depth === 0 ? 15 : 13.5 }}
        >
          {node.name}
        </span>
      </div>

      <div className="w-28 text-right font-semibold text-gray-800 text-sm">{fmt(node.actual)}</div>
      <div className="w-28 text-right font-semibold text-gray-800 text-sm">{fmt(node.le)}</div>
      <div className="w-28 text-right font-semibold text-gray-800 text-sm">{fmt(node.fyle)}</div>
      <div className="w-32 text-right font-semibold text-gray-800 text-sm">{fmt(node.proj)}</div>
      <div className="w-32 text-right">
        <div className={`font-bold text-sm ${positive ? "text-emerald-600" : "text-rose-600"}`}>{fmt(gap)}</div>
        <div className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
          {fmtPct(gapPct)}
        </div>
      </div>
    </div>
  );
}

function renderTree(node, depth, path, expanded, toggle, out) {
  const isOpen = expanded.has(path);
  out.push(<Row key={path} node={node} depth={depth} path={path} isOpen={isOpen} toggle={toggle} />);
  if (node.expandable && isOpen) {
    node.children.forEach((child) => renderTree(child, depth + 1, path + "/" + child.name, expanded, toggle, out));
  }
}

export default function DecompositionTree() {
  const [geoMode, setGeoMode] = useState(true);
  const [expanded, setExpanded] = useState(new Set(["Worldwide"]));

  const activeTree = geoMode ? GEO_TREE : TA_TREE;

  function toggle(path) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  function switchMode(isGeo) {
    setGeoMode(isGeo);
    setExpanded(new Set(["Worldwide"]));
  }

  const rows = [];
  renderTree(activeTree, 0, "Worldwide", expanded, toggle, rows);

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm font-sans">
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">Decomposition Tree</h2>
            <Info size={15} className="text-gray-400" />
            <span className="ml-3 text-xs font-semibold text-gray-400 tracking-wide">YEAR</span>
            <div className="border border-gray-300 rounded-md px-3 py-1 text-sm font-medium text-gray-700 bg-white">2026 ▾</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!geoMode}
            onClick={() => switchMode(!geoMode)}
            className="relative inline-flex items-center w-40 h-11 rounded-full bg-slate-900 shadow-inner transition-colors"
          >
            <span
              className={`absolute top-1 bottom-1 w-[76px] rounded-full bg-white shadow transition-transform duration-200 ease-out ${geoMode ? "translate-x-1" : "translate-x-[79px]"}`}
            />
            <span className={`relative z-10 w-1/2 text-center text-sm font-bold transition-colors ${geoMode ? "text-slate-900" : "text-white"}`}>Geo</span>
            <span className={`relative z-10 w-1/2 text-center text-sm font-bold transition-colors ${!geoMode ? "text-slate-900" : "text-white"}`}>TA</span>
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Selected year vs next year · shift coloured ▲ green / ▼ red · click any row to filter trend below
        </p>
        <p className="text-xs text-indigo-400 mt-1">
          {geoMode
            ? "Hierarchy: Worldwide → Country → Therapeutic Area → Brand"
            : "Hierarchy: Worldwide → Therapeutic Area → Brand → Country (+ Rest of ACE / Rest of ICR)"}
        </p>
      </div>

      <div className="flex items-center px-6 py-2 border-y border-gray-100 bg-gray-50/60">
        <div className="flex-1 text-[11px] font-semibold text-gray-400 tracking-wider pl-6">NAME</div>
        <div className="w-28 text-right text-[11px] font-semibold text-gray-400 tracking-wider">YTD ACTUAL</div>
        <div className="w-28 text-right text-[11px] font-semibold text-gray-400 tracking-wider">YTD LE</div>
        <div className="w-28 text-right text-[11px] font-semibold text-gray-400 tracking-wider">FY LE</div>
        <div className="w-32 text-right text-[11px] font-semibold text-gray-400 tracking-wider">FY PROJECTION</div>
        <div className="w-32 text-right text-[11px] font-semibold text-gray-400 tracking-wider">FY GAP</div>
      </div>

      <div>{rows}</div>
    </div>
  );
}
