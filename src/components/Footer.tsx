import { ChevronUp, ExternalLink, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface FamilyLink {
  label: string;
  url: string;
}

const FEATURED_LINKS: FamilyLink[] = [
  {
    label: "원클릭에이아이",
    url: "https://oneclickai.co.kr",
  },
];

const FRIEND_LINKS: FamilyLink[] = [
  {
    label: "옷차림 가이드",
    url: "https://service-112027796398.asia-east1.run.app",
  },
  {
    label: "속마음 (sokmaum.ai.studio)",
    url: "https://sokmaum.ai.studio",
  },
  {
    label: "냉털코치",
    url: "https://service-10-1630.ai.studio/",
  },
];

export function Footer() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600">
      <div className="max-w-[1440px] mx-auto px-6 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-bold text-slate-900 tracking-tight">세이브노트</span>
            <span className="text-slate-300" aria-hidden="true">|</span>
            <span className="text-xs font-medium text-slate-700">만든 사람 김민성</span>
            <span className="text-slate-300" aria-hidden="true">|</span>
            <span className="text-xs text-slate-500">2026 웹페이지 만들기 수업</span>
          </div>
          <p className="text-xs text-slate-400 font-mono-num">@20260529 김민성</p>
        </div>

        <div ref={containerRef} className="relative self-start md:self-auto">
          <div
            id="family-site-menu"
            aria-hidden={!open}
            className={`absolute bottom-full right-0 mb-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-30 transition-all duration-150 origin-bottom-right ${
              open
                ? "opacity-100 visible translate-y-0 pointer-events-auto"
                : "opacity-0 invisible translate-y-1 pointer-events-none"
            }`}
          >
            <div className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400">
              추천 사이트
            </div>
            <ul className="divide-y divide-slate-100">
              {FEATURED_LINKS.map((item) => (
                <li key={item.url}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={open ? 0 : -1}
                    className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                  >
                    <span className="truncate">{item.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-1 pt-2 border-t border-slate-200 px-3.5 py-1 text-[11px] font-semibold text-slate-400">
              옆자리 친구 사이트
            </div>
            <ul className="divide-y divide-slate-100">
              {FRIEND_LINKS.map((item) => (
                <li key={item.url}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={open ? 0 : -1}
                    className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.label}</div>
                      <div className="text-[11px] text-slate-400 font-mono-num truncate">
                        {item.url}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-1 pt-2 border-t border-slate-200 px-3.5 py-1 text-[11px] font-semibold text-slate-400">
              만든 사람 이메일
            </div>
            <a
              href="mailto:rlaalstjd0529@gmail.com"
              tabIndex={open ? 0 : -1}
              className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
            >
              <span className="font-mono-num truncate">rlaalstjd0529@gmail.com</span>
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </a>
          </div>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="family-site-menu"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center justify-between gap-6 px-4 py-2.5 text-xs font-semibold tracking-wide text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 min-w-[168px]"
          >
            <span>FAMILY SITE</span>
            <ChevronUp
              className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
    </footer>
  );
}
