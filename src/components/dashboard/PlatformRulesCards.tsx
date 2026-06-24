'use client';

import { useEffect, useState } from 'react';
import { BookOpen, X, AlertTriangle, ChevronRight } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';

interface Rule {
  id: number;
  title: string;
  description: string;
  content: string | null;
  image: string | null;
}

export default function PlatformRulesCards() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeRule, setActiveRule] = useState<Rule | null>(null);

  useEffect(() => {
    fetch('/api/platform-rules')
      .then((r) => r.json())
      .then((data) => { if (data.success) setRules(data.data); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Lock body scroll when modal open
  useEffect(() => {
    if (activeRule) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [activeRule]);

  if (!loaded || rules.length === 0) return null;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-white">Platform Guidelines</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rules.map((rule, i) => (
            <button
              key={rule.id}
              onClick={() => setActiveRule(rule)}
              className="group relative bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-slate-700 hover:-translate-y-1 transition-all duration-300 overflow-hidden text-left cursor-pointer"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative z-10 flex flex-col items-center text-center gap-3">
                {rule.image ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <img src={rule.image} alt={rule.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen size={22} className="text-emerald-400" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{rule.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{rule.description}</p>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Read More <ChevronRight size={12} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Full-Screen Premium Modal */}
      {activeRule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-modal-backdrop" onClick={() => setActiveRule(null)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-modal-slide flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-6 py-8 text-white flex-shrink-0">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full" />
              <button
                onClick={() => setActiveRule(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
              >
                <X size={18} />
              </button>
              <div className="relative z-10 flex items-center gap-4">
                {activeRule.image ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 animate-float-icon flex-shrink-0">
                    <img src={activeRule.image} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center border-2 border-white/20 animate-float-icon flex-shrink-0">
                    <BookOpen size={28} />
                  </div>
                )}
                <div>
                  <p className="text-indigo-200 text-xs uppercase tracking-wider font-medium">Platform Guide</p>
                  <h2 className="text-xl font-bold mt-1">{activeRule.title}</h2>
                  <p className="text-indigo-200 text-sm mt-1">{activeRule.description}</p>
                </div>
              </div>
            </div>

            {/* Body - scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {activeRule.content ? (
                <div
                  className="platform-rules-content prose prose-sm max-w-none animate-content-reveal"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeRule.content) }}
                />
              ) : (
                <div className="animate-content-reveal">
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Important Notice</p>
                      <p className="text-sm text-amber-700 mt-1">{activeRule.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex-shrink-0">
              <button
                onClick={() => setActiveRule(null)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
