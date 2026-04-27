import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../services/api";

// ─── DESIGN TOKENS (match reference: white, purple accent) ───────────────────
const C = {
  bg: "#eeeeff",
  white: "#ffffff",
  purple: "#7c3aed",
  purpleLight: "#ede9fe",
  purpleMid: "#a78bfa",
  green: "#10b981",
  greenLight: "#d1fae5",
  yellow: "#f59e0b",
  yellowLight: "#fef3c7",
  red: "#ef4444",
  redLight: "#fee2e2",
  blue: "#3b82f6",
  blueLight: "#dbeafe",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#9ca3af",
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const fmt = {
  brl: v => "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  brlShort: v => { v = Number(v); if (v >= 1e6) return "R$" + (v/1e6).toFixed(1) + "M"; if (v >= 1e3) return "R$" + (v/1e3).toFixed(1) + "K"; return "R$" + v.toFixed(2); },
  num: v => Number(v).toLocaleString("pt-BR"),
  pct: v => Number(v).toFixed(2) + "%",
  x: v => Number(v).toFixed(2) + "x",
};

function scoreOf(ins) {
  const roas = getROAS(ins), ctr = parseFloat(ins.ctr||0), cpc = parseFloat(ins.cpc||999);
  let s = 0;
  s += roas >= 4 ? 40 : roas >= 3 ? 35 : roas >= 2 ? 25 : roas >= 1 ? 15 : roas > 0 ? 5 : 0;
  s += ctr >= 3 ? 30 : ctr >= 2 ? 25 : ctr >= 1 ? 18 : ctr >= 0.5 ? 10 : 3;
  s += cpc < 0.5 ? 30 : cpc < 1 ? 25 : cpc < 2 ? 18 : cpc < 5 ? 10 : 3;
  return Math.min(Math.round(s), 100);
}
function scoreColor(s) { return s >= 70 ? C.green : s >= 40 ? C.yellow : C.red; }
function scoreLabel(s) { return s >= 80 ? "Excelente" : s >= 60 ? "Bom" : s >= 40 ? "Regular" : s >= 20 ? "Atenção" : "Crítico"; }
function getROAS(ins) {
  if (ins.purchase_roas?.[0]) return parseFloat(ins.purchase_roas[0].value);
  const av = ins.action_values?.find(a => a.action_type === "purchase")?.value;
  const sp = parseFloat(ins.spend||0);
  return av && sp > 0 ? parseFloat(av)/sp : 0;
}
function getConv(ins) { return parseInt(ins.actions?.find(a => a.action_type==="purchase")?.value||0); }
function getRevenue(ins) { return parseFloat(ins.action_values?.find(a => a.action_type==="purchase")?.value||0); }

function Badge({ color="gray", children }) {
  const map = { gray:[C.grayLight,C.gray], green:[C.greenLight,C.green], yellow:[C.yellowLight,C.yellow], red:[C.redLight,C.red], purple:[C.purpleLight,C.purple], blue:[C.blueLight,C.blue] };
  const [bg, fg] = map[color]||map.gray;
  return <span style={{ background: bg, color: fg, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{children}</span>;
}

function statusBadge(s) {
  const m = { ACTIVE:["green","ATIVA"], PAUSED:["yellow","PAUSADA"], ARCHIVED:["gray","ARQUIVADA"], WITH_ISSUES:["red","ERRO"] };
  const [c, l] = m[s]||["gray", s];
  return <Badge color={c}>{l}</Badge>;
}

function SimpleBarChart({ data, metric, colorFor, formatValue }) {
  const max = Math.max(...data.map((item) => Number(item[metric] || 0)), 1);
  return (
    <div style={{height:200, display:"flex", alignItems:"end", gap:10, paddingTop:16}}>
      {data.slice(0, 10).map((item, index) => {
        const value = Number(item[metric] || 0);
        const height = Math.max(8, (value / max) * 150);
        const color = typeof colorFor === "function" ? colorFor(item) : colorFor;
        return (
          <div key={`${item.name}-${index}`} title={`${item.name}: ${formatValue(value)}`} style={{flex:1, minWidth:34, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"end", gap:6}}>
            <div style={{fontSize:10, fontWeight:700, color, minHeight:12}}>{formatValue(value)}</div>
            <div style={{width:"100%", height, borderRadius:"8px 8px 3px 3px", background:color, opacity:0.9}} />
            <div style={{fontSize:10, color:C.muted, maxWidth:70, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.name}</div>
          </div>
        );
      })}
    </div>
  );
}

function SimpleLineMetric({ data, metric, formatValue }) {
  const max = Math.max(...data.map((item) => Number(item[metric] || 0)), 1);
  return (
    <div style={{height:160, display:"flex", alignItems:"center", gap:10, padding:"8px 0"}}>
      {data.slice(0, 12).map((item, index) => {
        const value = Number(item[metric] || 0);
        const y = 115 - (value / max) * 90;
        return (
          <div key={`${item.name}-${index}`} title={`${item.name}: ${formatValue(value)}`} style={{flex:1, minWidth:32, height:130, position:"relative"}}>
            <div style={{position:"absolute", left:"50%", top:y, width:10, height:10, borderRadius:"50%", background:C.purple, transform:"translate(-50%, -50%)", boxShadow:"0 0 0 4px rgba(124,58,237,.12)"}} />
            <div style={{position:"absolute", left:0, right:0, bottom:0, height:2, background:C.border}} />
            <div style={{position:"absolute", left:0, right:0, bottom:-18, fontSize:10, color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"center"}}>{item.name}</div>
          </div>
        );
      })}
    </div>
  );
}

function AdvisorPanel({ advisor, loading, onAnalyze }) {
  const ai = advisor?.ai;
  const priorities = ai?.priorities || advisor?.priorities || [];
  const campaignActions = ai?.campaignActions || advisor?.campaignActions || [];
  const experiments = ai?.experiments || advisor?.experiments || [];
  const questions = ai?.nextQuestions || advisor?.nextQuestions || [];

  return (
    <div style={{...{
      background:C.white,
      border:"1.5px solid "+C.border,
      borderRadius:14,
      padding:"18px 20px",
      marginBottom:20,
      borderTop:"3px solid "+C.purple,
    }}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:14}}>
        <div>
          <div style={{fontSize:15, fontWeight:800, color:C.text}}>Assistente IA de Trafego</div>
          <div style={{fontSize:12, color:C.muted, marginTop:2}}>
            Diagnostico de campanhas, prioridades, testes e proximas decisoes
          </div>
        </div>
        <button onClick={onAnalyze} disabled={loading} style={{
          background:C.purple,
          color:"#fff",
          border:"none",
          borderRadius:10,
          padding:"9px 14px",
          fontSize:12,
          fontWeight:800,
          cursor:"pointer",
          opacity:loading ? .65 : 1,
        }}>
          {loading ? "Analisando..." : advisor ? "Atualizar analise" : "Analisar campanhas"}
        </button>
      </div>

      {!advisor && (
        <div style={{fontSize:13, color:C.muted, background:C.grayLight, borderRadius:10, padding:"12px 14px"}}>
          Clique em analisar depois de buscar campanhas. A assistente vai cruzar investimento, CTR, CPC, frequencia, conversoes e ROAS.
        </div>
      )}

      {advisor && (
        <div style={{display:"grid", gap:14}}>
          <div style={{display:"grid", gridTemplateColumns:"1.2fr 1fr 1fr", gap:12}}>
            <div style={{background:C.purpleLight, borderRadius:12, padding:14}}>
              <div style={{fontSize:11, fontWeight:800, color:C.purple, textTransform:"uppercase", marginBottom:5}}>Diagnostico</div>
              <div style={{fontSize:13, color:C.text, lineHeight:1.45}}>
                {ai?.summary?.diagnosis || `Periodo com ${advisor.summary?.totalCampaigns || 0} campanhas e investimento de ${fmt.brl(advisor.summary?.spend || 0)}.`}
              </div>
            </div>
            <div style={{background:C.redLight, borderRadius:12, padding:14}}>
              <div style={{fontSize:11, fontWeight:800, color:C.red, textTransform:"uppercase", marginBottom:5}}>Risco</div>
              <div style={{fontSize:13, color:C.text, lineHeight:1.45}}>
                {ai?.summary?.mainRisk || priorities[0]?.reason || "Acompanhar volume antes de aumentar verba."}
              </div>
            </div>
            <div style={{background:C.greenLight, borderRadius:12, padding:14}}>
              <div style={{fontSize:11, fontWeight:800, color:C.green, textTransform:"uppercase", marginBottom:5}}>Oportunidade</div>
              <div style={{fontSize:13, color:C.text, lineHeight:1.45}}>
                {ai?.summary?.bestOpportunity || priorities.find(p => p.title?.toLowerCase().includes("escalar"))?.action || "Identificar campanha vencedora e escalar com cautela."}
              </div>
            </div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
            <div>
              <div style={{fontSize:13, fontWeight:800, marginBottom:8}}>Prioridades</div>
              <div style={{display:"grid", gap:8}}>
                {priorities.slice(0, 4).map((item, index) => (
                  <div key={index} style={{border:"1px solid "+C.border, borderRadius:10, padding:"10px 12px"}}>
                    <div style={{display:"flex", justifyContent:"space-between", gap:8, marginBottom:4}}>
                      <strong style={{fontSize:13}}>{item.title}</strong>
                      <Badge color={item.urgency === "alta" ? "red" : item.urgency === "media" ? "yellow" : "gray"}>{item.urgency || "media"}</Badge>
                    </div>
                    <div style={{fontSize:12, color:C.gray, lineHeight:1.45}}>{item.action}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{fontSize:13, fontWeight:800, marginBottom:8}}>Testes sugeridos</div>
              <div style={{display:"grid", gap:8}}>
                {experiments.slice(0, 3).map((item, index) => (
                  <div key={index} style={{border:"1px solid "+C.border, borderRadius:10, padding:"10px 12px"}}>
                    <strong style={{fontSize:13}}>{item.title}</strong>
                    <div style={{fontSize:12, color:C.gray, lineHeight:1.45, marginTop:4}}>{item.setup}</div>
                    <div style={{fontSize:11, color:C.purple, fontWeight:700, marginTop:6}}>{item.successMetric}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {campaignActions.length > 0 && (
            <div>
              <div style={{fontSize:13, fontWeight:800, marginBottom:8}}>Acoes por campanha</div>
              <div style={{display:"grid", gap:7}}>
                {campaignActions.slice(0, 6).map((item, index) => (
                  <div key={item.campaignName || index} style={{display:"grid", gridTemplateColumns:"1fr auto", gap:10, alignItems:"center", border:"1px solid "+C.border, borderRadius:10, padding:"9px 11px"}}>
                    <div>
                      <div style={{fontSize:12, fontWeight:800}}>{item.campaignName}</div>
                      <div style={{fontSize:12, color:C.gray, marginTop:3}}>{item.recommendation || item.why}</div>
                    </div>
                    {item.budgetAction && <Badge color={item.budgetAction === "aumentar" ? "green" : item.budgetAction === "pausar" || item.budgetAction === "reduzir" ? "red" : "purple"}>{item.budgetAction}</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {questions.length > 0 && (
            <div style={{fontSize:12, color:C.muted, borderTop:"1px solid "+C.border, paddingTop:10}}>
              <strong style={{color:C.text}}>Para refinar a assistente:</strong> {questions.slice(0, 3).join(" • ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── THERMOMETER GAUGE ────────────────────────────────────────────────────────
function Gauge({ score, size = 80 }) {
  const r = size * 0.37, cx = size/2, cy = size/2;
  const circ = 2*Math.PI*r, arc = circ*0.72;
  const fill = (score/100)*arc;
  const rotation = 126;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.grayLight} strokeWidth={size*0.07}
        strokeLinecap="round" strokeDasharray={`${arc} ${circ-arc}`}
        transform={`rotate(${rotation} ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size*0.07}
        strokeLinecap="round" strokeDasharray={`${fill} ${circ-fill+(circ-arc)}`}
        transform={`rotate(${rotation} ${cx} ${cy})`} style={{transition:"stroke-dasharray 0.8s"}} />
      <text x={cx} y={cy+3} textAnchor="middle" fill={color} fontSize={size*0.2} fontWeight="700">{score}</text>
    </svg>
  );
}

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
function makeDemo() {
  const cnames = ["Conversões — Black Friday","Tráfego Blog Awareness","Remarketing Carrinho","Lookalike Compradores","Engajamento Stories","Catálogo Dinâmico","Leads Formulário","Branding Video"];
  const statuses = ["ACTIVE","ACTIVE","ACTIVE","ACTIVE","PAUSED","ACTIVE","ACTIVE","PAUSED"];
  const objectives = ["CONVERSIONS","LINK_CLICKS","CONVERSIONS","CONVERSIONS","POST_ENGAGEMENT","PRODUCT_CATALOG_SALES","LEAD_GENERATION","BRAND_AWARENESS"];
  const images = ["https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80","https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80","https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80","https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80","https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80","https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80","https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80","https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80"];
  return cnames.map((name,i)=>{
    const spend=(Math.random()*4000+300).toFixed(2);
    const imp=Math.round(Math.random()*200000+10000);
    const clicks=Math.round(imp*(Math.random()*0.03+0.005));
    const cpc=(spend/clicks).toFixed(2);
    const cpm=((spend/imp)*1000).toFixed(2);
    const ctr=((clicks/imp)*100).toFixed(3);
    const conv=Math.round(clicks*(Math.random()*0.08+0.01));
    const revenue=(conv*(Math.random()*180+80)).toFixed(2);
    const roas=(revenue/spend).toFixed(2);
    return { id:"demo_"+i, name, status:statuses[i], effective_status:statuses[i], objective:objectives[i],
      creative:{ title:name, body:"Descrição da campanha "+name, image_url:images[i], thumbnail_url:images[i] },
      insights:{ data:[{ spend, impressions:String(imp), clicks:String(clicks), cpc, cpm, ctr,
        reach:String(Math.round(imp*0.7)), purchase_roas:parseFloat(roas)>0?[{value:roas}]:[],
        actions:[{action_type:"purchase",value:String(conv)}],
        action_values:[{action_type:"purchase",value:revenue}],
        frequency:((imp/(imp*0.7))).toFixed(2) }] } };
  });
}

const DEMO_AUDIENCES = [
  { id:"aud1", name:"Compradores últimos 180d", type:"CUSTOM", subtype:"WEBSITE", size:"12.400 – 18.200", status:"ready" },
  { id:"aud2", name:"Lookalike Compradores 1%", type:"LOOKALIKE", subtype:"LOOKALIKE", size:"1.2M – 1.5M", status:"ready" },
  { id:"aud3", name:"Visitantes Homepage 60d", type:"CUSTOM", subtype:"WEBSITE", size:"45.000 – 60.000", status:"ready" },
  { id:"aud4", name:"Engajamento Instagram 90d", type:"CUSTOM", subtype:"ENGAGEMENT", size:"8.300 – 12.000", status:"ready" },
  { id:"aud5", name:"Lista de E-mails CRM", type:"CUSTOM", subtype:"CUSTOMER_FILE", size:"5.200 – 7.800", status:"ready" },
];

const AUDIENCE_TEMPLATES = [
  { id:"t1", icon:"🛒", label:"Compradores Recentes", desc:"Quem comprou nos últimos 180 dias", type:"WEBSITE", event:"Purchase", window:180 },
  { id:"t2", icon:"👁", label:"Visitantes do Site", desc:"Visitaram qualquer página", type:"WEBSITE", event:"PageView", window:60 },
  { id:"t3", icon:"💜", label:"Seguidores Instagram", desc:"Engajaram com seu perfil", type:"ENGAGEMENT", event:"IG_ENGAGED_90D", window:90 },
  { id:"t4", icon:"🎯", label:"Lookalike 1% Brasil", desc:"Parecidos com seus compradores", type:"LOOKALIKE", event:"", window:0 },
  { id:"t5", icon:"📋", label:"Lista CRM", desc:"Importar e-mails de clientes", type:"CUSTOMER_FILE", event:"", window:0 },
  { id:"t6", icon:"🎬", label:"Visualizadores de Vídeo", desc:"Assistiram 50%+ dos vídeos", type:"ENGAGEMENT", event:"VIDEO_50_90D", window:90 },
];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MetaAdsMonitor() {
  const [tab, setTab] = useState("dashboard");
  const [config, setConfig] = useState({ accountId:"", period:"last_7d", status:"ACTIVE" });
  const [backendConfig, setBackendConfig] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [audiences, setAudiences] = useState(DEMO_AUDIENCES);
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [creativeFilter, setCreativeFilter] = useState("ALL");
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [newAud, setNewAud] = useState({ name:"", template:null });
  const [audienceStep, setAudienceStep] = useState(0); // 0=template 1=config 2=success
  const [sortBy, setSortBy] = useState("spend");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [advisor, setAdvisor] = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  const loadBackendConfig = useCallback(async () => {
    try {
      const r = await api.get("/prospects/meta-ads/config");
      setBackendConfig(r.data);
      if (r.data?.accountId && !config.accountId) {
        setConfig((prev) => ({ ...prev, accountId: r.data.accountId }));
      }
    } catch (e) {
      setBackendConfig({ configured: false, error: e.response?.data?.error || e.message });
    }
  }, [config.accountId]);

  useEffect(() => { loadBackendConfig(); }, [loadBackendConfig]);

  const loadDemo = () => {
    setCampaigns(makeDemo());
    setDemo(true);
    setConnected(true);
    setLastUpdated(new Date());
  };

  const fetchData = async () => {
    if (!backendConfig?.hasToken) { setError("Configure META_ACCESS_TOKEN no backend para buscar dados reais."); return; }
    if (!config.accountId && !backendConfig?.accountId) { setError("Configure META_AD_ACCOUNT_ID no backend ou informe o ID da conta."); return; }
    setError(""); setLoading(true);
    try {
      const params = { accountId: config.accountId || backendConfig.accountId, period: config.period, status: config.status, limit: 100 };
      const [campaignsRes, audiencesRes] = await Promise.all([
        api.get("/prospects/meta-ads/campaigns", { params }),
        api.get("/prospects/meta-ads/audiences", { params: { accountId: params.accountId, limit: 100 } }).catch(() => ({ data: { data: [] } })),
      ]);
      setCampaigns(campaignsRes.data?.data || []);
      setAdvisor(null);
      if (Array.isArray(audiencesRes.data?.data) && audiencesRes.data.data.length) {
        setAudiences(audiencesRes.data.data);
      }
      setConnected(true);
      setDemo(false);
      setLastUpdated(new Date());
    } catch(e) { setError("Erro Meta Ads: " + (e.response?.data?.error || e.message)); }
    setLoading(false);
  };

  const analyzeWithAdvisor = async () => {
    if (!backendConfig?.hasToken) { setError("Configure META_ACCESS_TOKEN no backend para usar a assistente."); return; }
    if (!config.accountId && !backendConfig?.accountId) { setError("Configure META_AD_ACCOUNT_ID no backend ou informe o ID da conta."); return; }
    setAdvisorLoading(true);
    setError("");
    try {
      const params = { accountId: config.accountId || backendConfig.accountId, period: config.period, status: config.status, limit: 100 };
      const response = await api.get("/prospects/meta-ads/advisor", { params });
      setAdvisor(response.data);
      setConnected(true);
      setDemo(false);
      setLastUpdated(new Date());
    } catch (e) {
      setError("Erro na assistente IA: " + (e.response?.data?.error || e.message));
    } finally {
      setAdvisorLoading(false);
    }
  };

  const processed = campaigns.map(c => ({ ...c, ins: c.insights?.data?.[0]||{} }));

  const totals = processed.reduce((a,c) => {
    a.spend += parseFloat(c.ins.spend||0);
    a.impressions += parseInt(c.ins.impressions||0);
    a.clicks += parseInt(c.ins.clicks||0);
    a.reach += parseInt(c.ins.reach||0);
    a.conversions += getConv(c.ins);
    a.revenue += getRevenue(c.ins);
    return a;
  }, { spend:0, impressions:0, clicks:0, reach:0, conversions:0, revenue:0 });
  totals.cpc = totals.clicks > 0 ? totals.spend/totals.clicks : 0;
  totals.cpm = totals.impressions > 0 ? (totals.spend/totals.impressions)*1000 : 0;
  totals.ctr = totals.impressions > 0 ? (totals.clicks/totals.impressions)*100 : 0;
  totals.roas = totals.spend > 0 ? totals.revenue/totals.spend : 0;
  totals.roi = totals.spend > 0 ? ((totals.revenue-totals.spend)/totals.spend)*100 : 0;
  totals.cpa = totals.conversions > 0 ? totals.spend/totals.conversions : 0;

  const filtered = processed.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a,b) => parseFloat(b.ins[sortBy]||0) - parseFloat(a.ins[sortBy]||0));

  const chartData = processed.map(c => ({
    name: c.name.length > 16 ? c.name.slice(0,14)+"…" : c.name,
    spend: parseFloat(c.ins.spend||0),
    roas: parseFloat(getROAS(c.ins).toFixed(2)),
    ctr: parseFloat(c.ins.ctr||0),
    clicks: parseInt(c.ins.clicks||0),
  }));

  const tabs = [
    { id:"dashboard", label:"Dashboard" },
    { id:"campanhas", label:"Campanhas" },
    { id:"criativos", label:"Criativos" },
    { id:"publicos", label:"Públicos" },
    { id:"relatorios", label:"Relatórios" },
  ];

  const s = { // styles obj
    app: { fontFamily:"'Inter',system-ui,sans-serif", background:C.bg, minHeight:"100vh", color:C.text },
    header: { background:C.white, borderBottom:"1.5px solid "+C.border, padding:"0 28px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58, position:"sticky", top:0, zIndex:100 },
    logo: { display:"flex", alignItems:"center", gap:10, fontWeight:700, fontSize:16, letterSpacing:"-0.02em" },
    logoIcon: { width:32, height:32, background:C.purple, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:16 },
    nav: { display:"flex", gap:2 },
    navBtn: (active) => ({ padding:"6px 16px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:500, transition:"all 0.15s", background: active ? C.purpleLight : "transparent", color: active ? C.purple : C.gray }),
    main: { padding:"24px 28px", maxWidth:1280, margin:"0 auto" },
    card: { background:C.white, border:"1.5px solid "+C.border, borderRadius:14, padding:"18px 20px" },
    kpiGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:14, marginBottom:22 },
    kpi: { background:C.white, border:"1.5px solid "+C.border, borderRadius:12, padding:"16px 18px" },
    kpiLabel: { fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600, marginBottom:6 },
    kpiVal: { fontSize:24, fontWeight:700, letterSpacing:"-0.03em", lineHeight:1, marginBottom:4 },
    kpiSub: { fontSize:11, color:C.muted },
    sectionTitle: { fontSize:15, fontWeight:700, marginBottom:14, color:C.text },
    configBar: { background:C.white, border:"1.5px solid "+C.border, borderRadius:14, padding:"16px 20px", marginBottom:20 },
    input: { border:"1.5px solid "+C.border, borderRadius:8, padding:"8px 12px", fontSize:13, outline:"none", fontFamily:"inherit", width:"100%", color:C.text, background:C.white },
    label: { fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 },
    btnPurple: { background:C.purple, color:"#fff", border:"none", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.15s" },
    btnGhost: { background:"transparent", color:C.gray, border:"1.5px solid "+C.border, borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:500, cursor:"pointer" },
    pill: (active) => ({ padding:"6px 14px", borderRadius:20, border: active ? "1.5px solid "+C.purple : "1.5px solid "+C.border, background: active ? C.purpleLight : C.white, color: active ? C.purple : C.gray, fontSize:12, fontWeight:500, cursor:"pointer" }),
    row: { display:"flex", alignItems:"center", gap:12 },
    col: { display:"flex", flexDirection:"column", gap:6 },
    divider: { height:1, background:C.border, margin:"16px 0" },
    table: { width:"100%", borderCollapse:"collapse", fontSize:13 },
    th: { padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:"1.5px solid "+C.border, whiteSpace:"nowrap" },
    td: { padding:"11px 14px", borderBottom:"1px solid "+C.border, whiteSpace:"nowrap" },
    modal: { position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 },
    modalBox: { background:C.white, borderRadius:18, padding:28, width:540, maxHeight:"80vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" },
  };

  return (
    <div style={s.app}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.logo}>
          <div style={s.logoIcon}>f</div>
          <div>
            <div>Meta Ads Monitor</div>
            <div style={{fontSize:10, fontWeight:400, color:C.muted, marginTop:-2}}>Campanhas · Criativos · Públicos · Relatórios</div>
          </div>
        </div>
        <div style={s.nav}>
          {tabs.map(t => <button key={t.id} style={s.navBtn(tab===t.id)} onClick={()=>setTab(t.id)}>{t.label}</button>)}
        </div>
        <div style={{...s.row, gap:10}}>
          {connected && <div style={{...s.row, gap:6}}>
            <div style={{width:7, height:7, borderRadius:"50%", background:C.green, boxShadow:"0 0 0 3px rgba(16,185,129,0.2)"}} />
            <span style={{fontSize:11, color:C.muted}}>{demo ? "DEMO" : "Conectado"}</span>
          </div>}
          {lastUpdated && <span style={{fontSize:11, color:C.muted}}>Atualizado {lastUpdated.toLocaleTimeString("pt-BR", {hour:"2-digit",minute:"2-digit"})}</span>}
        </div>
      </div>

      <div style={s.main}>
        {/* CONFIG BAR */}
        <div style={s.configBar}>
          <div style={{display:"grid", gridTemplateColumns:"1.2fr 1fr 160px 160px auto auto", gap:12, alignItems:"end"}}>
            <div style={s.col}>
              <span style={s.label}>Conexao Backend</span>
              <div style={{...s.input, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, minHeight:37}}>
                <span style={{fontWeight:700, color:backendConfig?.configured ? C.green : C.yellow}}>
                  {backendConfig?.configured ? "Meta configurado" : "Aguardando variaveis"}
                </span>
                <span style={{fontSize:11, color:C.muted}}>
                  {backendConfig?.graphVersion || "Graph API"}
                </span>
              </div>
            </div>
            <div style={s.col}>
              <span style={s.label}>Ad Account ID</span>
              <input style={s.input} placeholder="act_1234567890" value={config.accountId} onChange={e=>setConfig(p=>({...p,accountId:e.target.value}))} />
            </div>
            <div style={s.col}>
              <span style={s.label}>Período</span>
              <select style={s.input} value={config.period} onChange={e=>setConfig(p=>({...p,period:e.target.value}))}>
                <option value="today">Hoje</option>
                <option value="yesterday">Ontem</option>
                <option value="last_7d">Últimos 7 dias</option>
                <option value="last_14d">Últimos 14 dias</option>
                <option value="last_30d">Últimos 30 dias</option>
                <option value="this_month">Este mês</option>
                <option value="last_month">Mês passado</option>
              </select>
            </div>
            <div style={s.col}>
              <span style={s.label}>Status</span>
              <select style={s.input} value={config.status} onChange={e=>setConfig(p=>({...p,status:e.target.value}))}>
                <option value="ACTIVE">Ativas</option>
                <option value="PAUSED">Pausadas</option>
                <option value="ALL">Todas</option>
              </select>
            </div>
            <div style={s.col}><span style={s.label}>&nbsp;</span>
              <button style={s.btnPurple} onClick={fetchData} disabled={loading}>{loading ? "Buscando…" : "Buscar"}</button>
            </div>
            <div style={s.col}><span style={s.label}>&nbsp;</span>
              <button style={s.btnGhost} onClick={loadDemo}>Demo</button>
            </div>
          </div>
          {error && <div style={{marginTop:10, fontSize:12, color:C.red, background:C.redLight, borderRadius:8, padding:"8px 12px"}}>{error}</div>}
          {backendConfig && !backendConfig.configured && (
            <div style={{marginTop:10, fontSize:12, color:C.yellow, background:C.yellowLight, borderRadius:8, padding:"8px 12px"}}>
              Configure META_ACCESS_TOKEN e META_AD_ACCOUNT_ID no backend para monitorar campanhas reais. O token fica protegido no servidor.
            </div>
          )}
          {demo && <div style={{marginTop:10, fontSize:12, color:C.blue, background:C.blueLight, borderRadius:8, padding:"8px 12px"}}>ℹ️ Modo demonstração — dados fictícios para visualização</div>}
        </div>

        {/* EMPTY */}
        {!connected && (
          <div style={{...s.card, textAlign:"center", padding:"60px 20px"}}>
            <div style={{fontSize:40, marginBottom:12}}>📊</div>
            <div style={{fontSize:15, fontWeight:600, marginBottom:6}}>Conecte sua conta Meta Ads</div>
            <div style={{fontSize:13, color:C.muted}}>Configure as credenciais acima ou use o modo Demo para visualizar o painel</div>
          </div>
        )}

        {connected && (
          <AdvisorPanel advisor={advisor} loading={advisorLoading} onAnalyze={analyzeWithAdvisor} />
        )}

        {/* DASHBOARD TAB */}
        {connected && tab === "dashboard" && (
          <div>
            {/* KPIs */}
            <div style={s.kpiGrid}>
              {[
                { label:"Investimento", val:fmt.brlShort(totals.spend), sub:"Período selecionado", color:C.purple },
                { label:"ROAS", val:fmt.x(totals.roas), sub: totals.roas>=2?"Saudável":"Abaixo do ideal", color: totals.roas>=2?C.green:C.red },
                { label:"ROI", val:totals.roi.toFixed(1)+"%", sub:"Receita: "+fmt.brlShort(totals.revenue), color: totals.roi>=0?C.green:C.red },
                { label:"CPC Médio", val:fmt.brl(totals.cpc), sub:"Custo por clique", color:C.blue },
                { label:"CPM", val:fmt.brl(totals.cpm), sub:"Custo mil impressões", color:C.yellow },
                { label:"CTR", val:fmt.pct(totals.ctr), sub:fmt.num(totals.clicks)+" cliques", color:C.green },
                { label:"Conversões", val:fmt.num(totals.conversions), sub:"CPA: "+fmt.brl(totals.cpa), color:C.purple },
                { label:"Alcance", val:fmt.num(totals.reach), sub:fmt.num(totals.impressions)+" impressões", color:C.blue },
              ].map((k,i) => (
                <div key={i} style={{...s.kpi, borderTop:"3px solid "+k.color}}>
                  <div style={s.kpiLabel}>{k.label}</div>
                  <div style={{...s.kpiVal, color:k.color}}>{k.val}</div>
                  <div style={s.kpiSub}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20}}>
              <div style={s.card}>
                <div style={s.sectionTitle}>Investimento por campanha</div>
                <SimpleBarChart data={chartData} metric="spend" colorFor={C.purple} formatValue={fmt.brlShort} />
              </div>
              <div style={s.card}>
                <div style={s.sectionTitle}>ROAS por campanha</div>
                <SimpleBarChart data={chartData} metric="roas" colorFor={(d)=>d.roas>=2?C.green:d.roas>=1?C.yellow:C.red} formatValue={(v)=>v.toFixed(2)+"x"} />
              </div>
            </div>

            {/* CTR + Spend scatter style */}
            <div style={s.card}>
              <div style={s.sectionTitle}>CTR por campanha</div>
              <SimpleLineMetric data={chartData} metric="ctr" formatValue={(v)=>v.toFixed(2)+"%"} />
            </div>
          </div>
        )}

        {/* CAMPANHAS TAB */}
        {connected && tab === "campanhas" && (
          <div>
            <div style={{...s.row, marginBottom:16, gap:10, flexWrap:"wrap"}}>
              <input style={{...s.input, width:240}} placeholder="Buscar campanha…" value={search} onChange={e=>setSearch(e.target.value)} />
              <select style={{...s.input, width:160}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="spend">Ordenar: Investimento</option>
                <option value="ctr">Ordenar: CTR</option>
                <option value="cpc">Ordenar: CPC</option>
                <option value="cpm">Ordenar: CPM</option>
              </select>
            </div>

            {/* Thermometer Cards */}
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14, marginBottom:22}}>
              {sorted.map(c => {
                const score = scoreOf(c.ins);
                const color = scoreColor(score);
                const roas = getROAS(c.ins);
                const conv = getConv(c.ins);
                return (
                  <div key={c.id} style={{...s.card, borderTop:"3px solid "+color, padding:"16px 18px"}}>
                    <div style={{...s.row, justifyContent:"space-between", marginBottom:12}}>
                      <div style={{fontSize:13, fontWeight:600, color:C.text, lineHeight:1.4, flex:1, marginRight:10}}>{c.name}</div>
                      {statusBadge(c.effective_status||c.status)}
                    </div>
                    <div style={{...s.row, gap:16, marginBottom:14}}>
                      <Gauge score={score} size={72} />
                      <div>
                        <div style={{fontSize:20, fontWeight:700, color, letterSpacing:"-0.02em"}}>{scoreLabel(score)}</div>
                        <div style={{fontSize:11, color:C.muted, marginTop:2, textTransform:"uppercase", letterSpacing:"0.06em"}}>Performance Score</div>
                        <div style={{marginTop:8, height:5, background:C.grayLight, borderRadius:3, width:120}}>
                          <div style={{height:"100%", width:score+"%", background:color, borderRadius:3, transition:"width 0.8s"}} />
                        </div>
                      </div>
                    </div>
                    <div style={{borderTop:"1.5px solid "+C.border, paddingTop:12, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6}}>
                      {[
                        {l:"Invest.",v:fmt.brlShort(c.ins.spend||0)},
                        {l:"ROAS",v:roas>0?roas.toFixed(2)+"x":"—", color:roas>=2?C.green:roas>=1?C.yellow:C.muted},
                        {l:"CTR",v:fmt.pct(c.ins.ctr||0)},
                        {l:"CPC",v:fmt.brl(c.ins.cpc||0)},
                        {l:"CPM",v:fmt.brl(c.ins.cpm||0)},
                        {l:"Conv.",v:fmt.num(conv)},
                      ].map((m,i) => (
                        <div key={i} style={{textAlign:"center"}}>
                          <div style={{fontSize:12, fontWeight:600, color:m.color||C.text}}>{m.v}</div>
                          <div style={{fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", marginTop:1}}>{m.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full table */}
            <div style={s.card}>
              <div style={{...s.sectionTitle, marginBottom:0}}>Tabela Detalhada</div>
              <div style={s.divider} />
              <div style={{overflowX:"auto"}}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["Campanha","Status","Investimento","Impressões","Cliques","CTR","CPC","CPM","Alcance","Freq.","Conversões","Receita","ROAS","CPA","Score"].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(c => {
                      const roas = getROAS(c.ins), conv = getConv(c.ins), rev = getRevenue(c.ins);
                      const cpa = conv > 0 ? parseFloat(c.ins.spend||0)/conv : 0;
                      const score = scoreOf(c.ins);
                      return (
                        <tr key={c.id} style={{transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background=C.grayLight} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={{...s.td, fontWeight:600, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis"}}>{c.name}</td>
                          <td style={s.td}>{statusBadge(c.effective_status||c.status)}</td>
                          <td style={s.td}>{fmt.brl(c.ins.spend||0)}</td>
                          <td style={s.td}>{fmt.num(c.ins.impressions||0)}</td>
                          <td style={s.td}>{fmt.num(c.ins.clicks||0)}</td>
                          <td style={s.td}>{fmt.pct(c.ins.ctr||0)}</td>
                          <td style={s.td}>{fmt.brl(c.ins.cpc||0)}</td>
                          <td style={s.td}>{fmt.brl(c.ins.cpm||0)}</td>
                          <td style={s.td}>{fmt.num(c.ins.reach||0)}</td>
                          <td style={s.td}>{parseFloat(c.ins.frequency||0).toFixed(2)}</td>
                          <td style={s.td}>{fmt.num(conv)}</td>
                          <td style={s.td}>{rev > 0 ? fmt.brl(rev) : "—"}</td>
                          <td style={{...s.td, color: roas>=2?C.green:roas>=1?C.yellow:C.muted, fontWeight:600}}>{roas>0?roas.toFixed(2)+"x":"—"}</td>
                          <td style={s.td}>{cpa > 0 ? fmt.brl(cpa) : "—"}</td>
                          <td style={{...s.td, color:scoreColor(score), fontWeight:700}}>{score}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CRIATIVOS TAB */}
        {connected && tab === "criativos" && (
          <div>
            <div style={{...s.row, marginBottom:16, gap:8, flexWrap:"wrap"}}>
              {["ALL","ACTIVE","PAUSED"].map(f => (
                <button key={f} style={s.pill(creativeFilter===f)} onClick={()=>setCreativeFilter(f)}>
                  {f==="ALL"?"Todos":f==="ACTIVE"?"Ativos":"Pausados"}
                </button>
              ))}
              <div style={{marginLeft:"auto", fontSize:12, color:C.muted}}>{processed.length} criativos</div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16}}>
              {processed.filter(c => creativeFilter==="ALL" || c.status===creativeFilter).map(c => {
                const roas = getROAS(c.ins), score = scoreOf(c.ins), color = scoreColor(score);
                return (
                  <div key={c.id} style={{...s.card, padding:0, overflow:"hidden"}}>
                    {/* Creative Image */}
                    <div style={{position:"relative", paddingTop:"56%", background:C.grayLight, overflow:"hidden"}}>
                      {c.creative?.image_url ? (
                        <img src={c.creative.image_url} alt="criativo" style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover"}} />
                      ) : (
                        <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32}}>🖼</div>
                      )}
                      <div style={{position:"absolute", top:8, right:8}}>{statusBadge(c.effective_status||c.status)}</div>
                      <div style={{position:"absolute", top:8, left:8, background:"rgba(0,0,0,0.6)", color:"#fff", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700}}>
                        Score {score}
                      </div>
                      <div style={{position:"absolute", bottom:0, left:0, right:0, height:4, background:color}} />
                    </div>
                    {/* Info */}
                    <div style={{padding:"14px 16px"}}>
                      <div style={{fontSize:13, fontWeight:600, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.name}</div>
                      <div style={{fontSize:12, color:C.muted, marginBottom:10, height:32, overflow:"hidden", lineHeight:1.4}}>
                        {c.creative?.body || c.objective || "—"}
                      </div>
                      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, borderTop:"1px solid "+C.border, paddingTop:10}}>
                        {[
                          {l:"Invest.",v:fmt.brlShort(c.ins.spend||0),c:C.purple},
                          {l:"CTR",v:fmt.pct(c.ins.ctr||0),c:C.blue},
                          {l:"ROAS",v:roas>0?roas.toFixed(2)+"x":"—",c:roas>=2?C.green:C.muted},
                          {l:"Cliques",v:fmt.num(c.ins.clicks||0),c:C.text},
                          {l:"Alcance",v:fmt.num(c.ins.reach||0),c:C.text},
                          {l:"CPM",v:fmt.brl(c.ins.cpm||0),c:C.text},
                        ].map((m,i) => (
                          <div key={i} style={{textAlign:"center"}}>
                            <div style={{fontSize:12, fontWeight:600, color:m.c}}>{m.v}</div>
                            <div style={{fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em"}}>{m.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PÚBLICOS TAB */}
        {connected && tab === "publicos" && (
          <div>
            <div style={{...s.row, justifyContent:"space-between", marginBottom:16}}>
              <div style={s.sectionTitle}>Públicos ({audiences.length})</div>
              <button style={s.btnPurple} onClick={()=>{setShowAudienceModal(true);setAudienceStep(0);setNewAud({name:"",template:null})}}>+ Criar Público</button>
            </div>

            {/* Audience cards */}
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14, marginBottom:28}}>
              {audiences.map(a => {
                const icons = { WEBSITE:"🌐", LOOKALIKE:"🎯", CUSTOMER_FILE:"📋", ENGAGEMENT:"💜" };
                const icon = icons[a.subtype]||"👥";
                return (
                  <div key={a.id} style={s.card}>
                    <div style={{...s.row, marginBottom:10}}>
                      <div style={{fontSize:24}}>{icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13, fontWeight:600}}>{a.name}</div>
                        <div style={{fontSize:11, color:C.muted}}>{a.type} · {a.subtype}</div>
                      </div>
                      <Badge color={a.status==="ready"?"green":"yellow"}>{a.status==="ready"?"Pronto":"Processando"}</Badge>
                    </div>
                    <div style={{...s.row, justifyContent:"space-between"}}>
                      <div style={{fontSize:12, color:C.muted}}>Tamanho estimado</div>
                      <div style={{fontSize:13, fontWeight:600, color:C.purple}}>{a.size}</div>
                    </div>
                    <div style={s.divider} />
                    <div style={{...s.row, gap:8}}>
                      <button style={{...s.btnGhost, fontSize:12, padding:"6px 12px"}}>Ver Detalhes</button>
                      <button style={{...s.btnGhost, fontSize:12, padding:"6px 12px"}}>Criar Lookalike</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Templates section */}
            <div style={s.card}>
              <div style={s.sectionTitle}>Modelos de Público</div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12}}>
                {AUDIENCE_TEMPLATES.map(t => (
                  <div key={t.id} style={{border:"1.5px solid "+C.border, borderRadius:12, padding:"14px 16px", cursor:"pointer", transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.purple;e.currentTarget.style.background=C.purpleLight}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.white}}
                    onClick={()=>{setNewAud({name:t.label,template:t});setShowAudienceModal(true);setAudienceStep(1)}}>
                    <div style={{fontSize:22, marginBottom:8}}>{t.icon}</div>
                    <div style={{fontSize:13, fontWeight:600, marginBottom:4}}>{t.label}</div>
                    <div style={{fontSize:12, color:C.muted}}>{t.desc}</div>
                    {t.window > 0 && <div style={{marginTop:8}}><Badge color="purple">{t.window} dias</Badge></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RELATÓRIOS TAB */}
        {connected && tab === "relatorios" && (
          <div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20}}>
              <div style={s.card}>
                <div style={s.sectionTitle}>Resumo do Período</div>
                {[
                  ["Investimento Total", fmt.brl(totals.spend)],
                  ["Receita Gerada", totals.revenue > 0 ? fmt.brl(totals.revenue) : "—"],
                  ["ROAS Médio", fmt.x(totals.roas)],
                  ["ROI", totals.roi.toFixed(1)+"%"],
                  ["Impressões", fmt.num(totals.impressions)],
                  ["Cliques", fmt.num(totals.clicks)],
                  ["CTR Médio", fmt.pct(totals.ctr)],
                  ["CPC Médio", fmt.brl(totals.cpc)],
                  ["CPM Médio", fmt.brl(totals.cpm)],
                  ["Alcance Total", fmt.num(totals.reach)],
                  ["Conversões", fmt.num(totals.conversions)],
                  ["CPA Médio", totals.cpa > 0 ? fmt.brl(totals.cpa) : "—"],
                ].map(([l,v]) => (
                  <div key={l} style={{display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid "+C.border}}>
                    <span style={{fontSize:13, color:C.muted}}>{l}</span>
                    <span style={{fontSize:13, fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={s.card}>
                <div style={s.sectionTitle}>Top Campanhas por ROAS</div>
                {[...processed].sort((a,b)=>getROAS(b.ins)-getROAS(a.ins)).slice(0,8).map((c,i) => {
                  const roas = getROAS(c.ins);
                  return (
                    <div key={c.id} style={{display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid "+C.border}}>
                      <div style={{fontSize:11, fontWeight:700, color:C.muted, width:16}}>{i+1}</div>
                      <div style={{flex:1, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.name}</div>
                      <div style={{fontSize:13, fontWeight:700, color:roas>=2?C.green:roas>=1?C.yellow:C.red}}>{roas>0?roas.toFixed(2)+"x":"—"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{...s.card, textAlign:"center", padding:"24px 20px"}}>
              <div style={{fontSize:14, fontWeight:600, marginBottom:6}}>Exportar Dados</div>
              <div style={{fontSize:13, color:C.muted, marginBottom:16}}>Baixe os dados completos em CSV para análise externa</div>
              <div style={{...s.row, justifyContent:"center", gap:12}}>
                <button style={s.btnPurple} onClick={() => {
                  const rows = processed.map(c => {
                    const roas=getROAS(c.ins), conv=getConv(c.ins), rev=getRevenue(c.ins), cpa=conv>0?parseFloat(c.ins.spend||0)/conv:0;
                    return [`"${c.name}"`,c.status,parseFloat(c.ins.spend||0).toFixed(2),c.ins.impressions||0,c.ins.clicks||0,parseFloat(c.ins.ctr||0).toFixed(3),parseFloat(c.ins.cpc||0).toFixed(2),parseFloat(c.ins.cpm||0).toFixed(2),c.ins.reach||0,parseFloat(c.ins.frequency||0).toFixed(2),conv,rev.toFixed(2),roas.toFixed(2),cpa.toFixed(2),scoreOf(c.ins)].join(",");
                  });
                  const csv = ["Campanha,Status,Invest,Impressões,Cliques,CTR,CPC,CPM,Alcance,Freq,Conv,Receita,ROAS,CPA,Score", ...rows].join("\n");
                  const b = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
                  const l = document.createElement("a"); l.href = URL.createObjectURL(b); l.download = "meta-ads.csv"; l.click();
                }}>📥 Exportar CSV</button>
                <button style={s.btnGhost} onClick={() => window.print()}>🖨 Imprimir</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AUDIENCE MODAL */}
      {showAudienceModal && (
        <div style={s.modal} onClick={e=>e.target===e.currentTarget&&setShowAudienceModal(false)}>
          <div style={s.modalBox}>
            {audienceStep === 0 && (
              <>
                <div style={{fontSize:16, fontWeight:700, marginBottom:4}}>Criar Novo Público</div>
                <div style={{fontSize:13, color:C.muted, marginBottom:20}}>Escolha um modelo para começar</div>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
                  {AUDIENCE_TEMPLATES.map(t => (
                    <div key={t.id} style={{border:"1.5px solid "+C.border, borderRadius:12, padding:"14px 16px", cursor:"pointer"}}
                      onClick={()=>{setNewAud({name:t.label,template:t});setAudienceStep(1)}}>
                      <div style={{fontSize:20, marginBottom:6}}>{t.icon}</div>
                      <div style={{fontSize:13, fontWeight:600}}>{t.label}</div>
                      <div style={{fontSize:11, color:C.muted}}>{t.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{...s.row, justifyContent:"flex-end", marginTop:20}}>
                  <button style={s.btnGhost} onClick={()=>setShowAudienceModal(false)}>Cancelar</button>
                </div>
              </>
            )}
            {audienceStep === 1 && newAud.template && (
              <>
                <div style={{...s.row, marginBottom:20, gap:10}}>
                  <div style={{fontSize:24}}>{newAud.template.icon}</div>
                  <div>
                    <div style={{fontSize:16, fontWeight:700}}>{newAud.template.label}</div>
                    <div style={{fontSize:12, color:C.muted}}>{newAud.template.desc}</div>
                  </div>
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:14}}>
                  <div style={s.col}>
                    <span style={s.label}>Nome do Público</span>
                    <input style={s.input} value={newAud.name} onChange={e=>setNewAud(p=>({...p,name:e.target.value}))} placeholder="Ex: Compradores Q4 2024" />
                  </div>
                  {newAud.template.window > 0 && (
                    <div style={s.col}>
                      <span style={s.label}>Janela de Lookback (dias)</span>
                      <input style={s.input} type="number" defaultValue={newAud.template.window} min={1} max={180} />
                    </div>
                  )}
                  {newAud.template.type === "LOOKALIKE" && (
                    <div style={s.col}>
                      <span style={s.label}>Público Base</span>
                      <select style={s.input}>
                        {audiences.filter(a=>a.type==="CUSTOM").map(a=><option key={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  )}
                  {newAud.template.type === "LOOKALIKE" && (
                    <div style={s.col}>
                      <span style={s.label}>Tamanho (% por país)</span>
                      <select style={s.input}>
                        <option>1% — Mais similar</option><option>2%</option><option>3%</option><option>5%</option><option>10% — Mais amplo</option>
                      </select>
                    </div>
                  )}
                  {newAud.template.type === "CUSTOMER_FILE" && (
                    <div style={{border:"2px dashed "+C.border, borderRadius:10, padding:"20px", textAlign:"center"}}>
                      <div style={{fontSize:20, marginBottom:6}}>📎</div>
                      <div style={{fontSize:13, fontWeight:500}}>Arraste ou selecione o arquivo CSV</div>
                      <div style={{fontSize:11, color:C.muted, marginTop:4}}>Colunas: email, phone, fn, ln</div>
                    </div>
                  )}
                  <div style={s.col}>
                    <span style={s.label}>País / Localização</span>
                    <select style={s.input}><option>Brasil</option><option>Argentina</option><option>Portugal</option><option>EUA</option></select>
                  </div>
                </div>
                <div style={{...s.row, justifyContent:"flex-end", marginTop:20, gap:10}}>
                  <button style={s.btnGhost} onClick={()=>setAudienceStep(0)}>Voltar</button>
                  <button style={s.btnPurple} onClick={()=>{
                    setAudiences(prev=>[...prev,{id:"new_"+Date.now(), name:newAud.name||newAud.template.label, type:newAud.template.type, subtype:newAud.template.type, size:"Calculando…", status:"processing"}]);
                    setAudienceStep(2);
                  }}>Criar Público</button>
                </div>
              </>
            )}
            {audienceStep === 2 && (
              <div style={{textAlign:"center", padding:"20px 0"}}>
                <div style={{fontSize:48, marginBottom:16}}>✅</div>
                <div style={{fontSize:16, fontWeight:700, marginBottom:6}}>Público criado com sucesso!</div>
                <div style={{fontSize:13, color:C.muted, marginBottom:24}}>O público <strong>{newAud.name}</strong> foi criado e estará disponível em alguns minutos.</div>
                <div style={{...s.row, justifyContent:"center", gap:10}}>
                  <button style={s.btnGhost} onClick={()=>setShowAudienceModal(false)}>Fechar</button>
                  <button style={s.btnPurple} onClick={()=>{setShowAudienceModal(false);setTab("publicos")}}>Ver Públicos</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
