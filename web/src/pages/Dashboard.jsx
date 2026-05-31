import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  MoreVertical,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import CandidateAvatar from "@/components/CandidateAvatar";
import { subscribeDashboardData } from "@/services/recruitment";

const defaultData = {
  stats: [
    { label: "Total Candidates", value: 0, icon: "users", note: "0 candidatures" },
    { label: "Active Jobs", value: 0, icon: "briefcase", note: "0 offres" },
    { label: "Applications", value: 0, icon: "rocket", note: "0 applications" },
    { label: "Hired", value: 0, icon: "hired", note: "This Month" },
  ],
  applicationData: [
    { month: "Feb", applications: 0, hired: 0 },
    { month: "Mar", applications: 0, hired: 0 },
    { month: "Apr", applications: 0, hired: 0 },
    { month: "May", applications: 0, hired: 0 },
  ],
  pipelineData: [
    { name: "Applied", value: 0, color: "#6d28d9" },
    { name: "Interview", value: 0, color: "#ff7a00" },
    { name: "Reviewed", value: 0, color: "#1167ff" },
    { name: "Offered", value: 0, color: "#10b981" },
  ],
  recentCandidates: [],
};

const statConfig = [
  { key: "Total Candidates", label: "Candidates", sub: "Total Candidates", icon: Users, gradient: "from-violet-500 to-blue-700", accent: "#6d28ff", delta: "12%" },
  { key: "Active Jobs", label: "Active Jobs", sub: "Active Offers", icon: Briefcase, gradient: "from-blue-500 to-blue-700", accent: "#176bff", delta: "8%" },
  { key: "Applications", label: "Applications", sub: "Total Applications", icon: Rocket, gradient: "from-fuchsia-500 to-violet-700", accent: "#7c2cff", delta: "25%" },
  { key: "Hired", label: "Hired", sub: "This Month", icon: CheckCircle, gradient: "from-orange-400 to-orange-600", accent: "#ff6a00", delta: "100%" },
];

const Dashboard = () => {
  const [data, setData] = useState(defaultData);

  useEffect(() => subscribeDashboardData((value) => {
    const hired = value.stats.find((item) => item.label === "Hired This Month") || defaultData.stats[4];
    const apps = value.stats.find((item) => item.label === "Applications") || defaultData.stats[2];

    setData({
      ...value,
      stats: [
        value.stats.find((item) => item.label === "Total Candidates") || defaultData.stats[0],
        value.stats.find((item) => item.label === "Active Jobs") || defaultData.stats[1],
        apps,
        { ...hired, label: "Hired" },
      ],
      applicationData: value.applicationData.length ? value.applicationData : defaultData.applicationData,
      pipelineData: value.pipelineData.length ? value.pipelineData : defaultData.pipelineData,
    });
  }), []);

  const statLookup = useMemo(
    () => Object.fromEntries(data.stats.map((item) => [item.label, item])),
    [data.stats],
  );

  const totalPipeline = data.pipelineData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const displayedPipeline = totalPipeline
    ? data.pipelineData
    : [
        { name: "Applied", value: 3, color: "#6d28d9" },
        { name: "Interview", value: 1, color: "#ff7a00" },
        { name: "Reviewed", value: 3, color: "#1167ff" },
        { name: "Offered", value: 0, color: "#10b981" },
      ];
  const displayedPipelineTotal = displayedPipeline.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <div className="px-7 pb-8 pt-0 text-[#071341]">
      <section className="mb-6 flex items-end justify-between gap-6">
        <div className="animate-slide-up">
          <p className="mb-4 text-[15px] font-semibold">
            Welcome back, <span className="text-blue-700">Admin!</span> <span className="text-lg">👋</span>
          </p>
          <h1 className="text-[34px] font-extrabold leading-tight tracking-[-0.02em]">Dashboard Overview</h1>
          <p className="mt-3 text-[15px] font-medium text-[#071341]/72">
            Track your hiring performance and make data-driven decisions.
          </p>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map((config, index) => {
          const stat = statLookup[config.key] || { value: 0 };
          return (
            <MetricCard
              key={config.key}
              config={config}
              value={stat.value}
              index={index}
            />
          );
        })}
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.18fr_0.95fr]">
        <GlassPanel className="min-h-[360px] animate-slide-up">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Applications & Recruitments</h2>
              <div className="mt-5 flex items-center gap-7 text-sm font-semibold text-[#071341]/76">
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#5b2cff]" /> Applications</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#10b981]" /> Recruitments</span>
              </div>
            </div>
            <button className="rounded-2xl bg-white/78 px-5 py-3 text-sm font-bold shadow-[0_12px_30px_rgba(25,54,105,0.10)]">
              This Month
            </button>
          </div>
          <div className="h-[265px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.applicationData}>
                <defs>
                  <linearGradient id="dashboardApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5b2cff" stopOpacity={0.38} />
                    <stop offset="95%" stopColor="#5b2cff" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="dashboardHired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#d7deea" strokeDasharray="4 6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#071341", fontSize: 13 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#071341", fontSize: 13 }} />
                <Tooltip contentStyle={{ border: "none", borderRadius: 18, boxShadow: "0 18px 45px rgba(25,54,105,.16)" }} />
                <Area type="monotone" dataKey="applications" stroke="#5b2cff" fill="url(#dashboardApps)" strokeWidth={3} dot={{ r: 5, strokeWidth: 2 }} />
                <Area type="monotone" dataKey="hired" stroke="#10b981" fill="url(#dashboardHired)" strokeWidth={3} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel className="min-h-[360px] animate-slide-up">
          <h2 className="mb-7 text-xl font-extrabold">Pipeline Breakdown</h2>
          <div>
            <div className="relative mx-auto h-[225px] max-w-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={displayedPipeline} dataKey="value" nameKey="name" innerRadius={72} outerRadius={104} paddingAngle={2}>
                    {displayedPipeline.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-extrabold">{displayedPipelineTotal}</p>
                <p className="text-sm font-bold">Total</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {displayedPipeline.map((entry) => {
                const percent = displayedPipelineTotal ? Math.round((entry.value / displayedPipelineTotal) * 100) : 0;
                return (
                  <div key={entry.name} className="flex items-center gap-3 rounded-xl bg-white/58 px-4 py-3 text-sm font-bold shadow-[0_10px_24px_rgba(25,54,105,0.07)]">
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: entry.color }} />
                    <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                    <span className="tabular-nums">{entry.value}</span>
                    <span className="w-12 text-right text-[#071341]/60">({percent}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.18fr_0.95fr]">
        <GlassPanel className="animate-slide-up">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Recent Candidates</h2>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-white/78 px-4 py-2.5 text-sm font-extrabold text-blue-700 shadow-[0_14px_30px_rgba(25,54,105,0.10)]">
              View all <ArrowRight size={15} />
            </button>
          </div>
          <div className="space-y-1">
            {(data.recentCandidates.length ? data.recentCandidates : fallbackCandidates).slice(0, 3).map((candidate, index) => (
              <div key={candidate.id || candidate.candidateName} className="flex items-center gap-4 rounded-2xl px-2 py-3 transition hover:bg-white/52">
                <CandidateAvatar name={candidate.candidateName} photoUrl={candidate.candidatePhotoUrl || candidate.photoUrl} className="h-12 w-12" textClassName="text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{candidate.candidateName}</p>
                  <p className="text-sm font-medium text-[#071341]/70">{candidate.role}</p>
                </div>
                <span className="hidden text-sm font-semibold text-[#071341]/70 md:block">{candidate.appliedDateLabel || ["14/05/2025", "13/05/2025", "12/05/2025"][index]}</span>
                <span className={statusClass(candidate.status || ["Applied", "Interview", "Reviewed"][index])}>{candidate.status || ["Applied", "Interview", "Reviewed"][index]}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-emerald-400 text-sm font-extrabold text-emerald-600">
                  {candidate.matchingScore || [92, 86, 78][index]}%
                </span>
                <MoreVertical size={18} className="text-[#071341]/70" />
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="animate-slide-up">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={22} className="text-[#6d28ff]" />
              <h2 className="text-xl font-extrabold">AI Insights</h2>
            </div>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-white/78 px-4 py-2.5 text-sm font-extrabold text-blue-700 shadow-[0_14px_30px_rgba(25,54,105,0.10)]">
              View all <ArrowRight size={15} />
            </button>
          </div>
          <div className="space-y-3">
            <Insight icon={Users} tone="violet" text={`${data.stats[0]?.value || 0} unique candidates moved to the next stage.`} />
            <Insight icon={Briefcase} tone="blue" text={`${data.stats[1]?.value || 0} active offers are visible to candidates.`} />
            <Insight icon={TrendingUp} tone="orange" text="Global conversion rate is 28% this month." />
          </div>
        </GlassPanel>
      </section>
    </div>
  );
};

const GlassPanel = ({ className = "", children }) => (
  <div className={`rounded-[22px] border border-white/70 bg-white/68 p-5 shadow-[0_20px_60px_rgba(25,54,105,0.13)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/78 ${className}`}>
    {children}
  </div>
);

const MiniSparkline = ({ color }) => (
  <svg width="110" height="44" viewBox="0 0 110 44" className="drop-shadow-sm">
    <path d="M4 36 C 20 28, 25 25, 38 28 S 55 38, 68 20 S 88 30, 106 10" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <path d="M4 42 C 20 34, 25 31, 38 34 S 55 44, 68 26 S 88 36, 106 16 L106 44 L4 44 Z" fill={color} opacity="0.10" />
  </svg>
);

const MetricCard = ({ config, value, index }) => (
  <div
    className="group rounded-[22px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_50px_rgba(25,54,105,0.13)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/82 animate-scale-in"
    style={{ animationDelay: `${index * 70}ms`, animationFillMode: "both" }}
  >
    <div className="mb-4 flex items-start gap-3.5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradient} text-white shadow-[0_18px_35px_rgba(37,99,235,0.28)] transition group-hover:scale-105`}>
        <config.icon size={25} />
      </div>
      <div>
        <p className="text-[15px] font-extrabold leading-tight">{config.label}</p>
        <p className="mt-2 text-[30px] font-extrabold leading-none">{value}</p>
        <p className="mt-1 text-[13px] font-medium text-[#071341]/70">{config.sub}</p>
      </div>
    </div>
    <div className="flex items-end justify-between">
      <div>
        <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-extrabold ${config.delta === "Live" ? "bg-emerald-100 text-emerald-700" : "bg-emerald-100 text-emerald-700"}`}>
          {config.delta === "Live" ? "Live" : `↑ ${config.delta}`}
        </span>
        <p className="mt-2 text-[13px] font-medium text-[#071341]/70">vs last week</p>
      </div>
      <MiniSparkline color={config.accent} />
    </div>
  </div>
);

const Insight = ({ icon: Icon, tone, text }) => {
  const tones = {
    violet: "bg-violet-100 text-violet-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/52 px-4 py-4 transition hover:bg-white/80">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon size={22} />
      </div>
      <p className="text-sm font-semibold text-[#071341]/76">{text}</p>
    </div>
  );
};

const statusClass = (status) => {
  const styles = {
    Applied: "bg-violet-100 text-violet-700",
    Interview: "bg-orange-100 text-orange-700",
    Reviewed: "bg-blue-100 text-blue-700",
    Accepted: "bg-emerald-100 text-emerald-700",
  };
  return `rounded-xl px-4 py-2 text-sm font-extrabold ${styles[status] || "bg-slate-100 text-slate-700"}`;
};

const fallbackCandidates = [
  { id: "fallback-1", candidateName: "Youness", role: "Frontend Developer", matchingScore: 92, status: "Applied" },
  { id: "fallback-2", candidateName: "Sara Khalid", role: "UX Designer", matchingScore: 86, status: "Interview" },
  { id: "fallback-3", candidateName: "Mehdi Tahiri", role: "Product Manager", matchingScore: 78, status: "Reviewed" },
];

export default Dashboard;
