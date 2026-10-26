import React from 'react';
import { FiCpu, FiShield, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

/**
 * FallbackDisclosure Component
 * Standardized Phase 3 AI Fallback Transparency disclosure
 * Renders clear indicators when heuristic simulation is active vs. live Gemini AI.
 */
const FallbackDisclosure = ({
  isSimulated = true,
  engineName = 'Heuristic Career Simulation Engine',
  compact = true,
  className = ''
}) => {
  if (compact) {
    return isSimulated ? (
      <span
        title={`Generated using ${engineName} while live AI model is unavailable.`}
        className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/25 ${className}`}
      >
        <FiCpu size={12} className="text-amber-500" aria-hidden="true" />
        <span>Evidence-Based Heuristic Evaluation</span>
      </span>
    ) : (
      <span
        title="Verified with Live Google Gemini AI."
        className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/25 ${className}`}
      >
        <FiCheckCircle size={12} className="text-emerald-500" aria-hidden="true" />
        <span>Live Gemini AI Verified</span>
      </span>
    );
  }

  // Expanded banner mode
  return isSimulated ? (
    <div
      role="status"
      className={`p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-3 text-xs leading-relaxed ${className}`}
    >
      <FiCpu size={18} className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Heuristic Simulation Mode Active
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 font-semibold">
            {engineName}
          </span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
          This result was generated using calibrated algorithmic heuristics and career rubric models to provide uninterrupted service while live AI services are offline or unconfigured.
        </p>
      </div>
    </div>
  ) : (
    <div
      role="status"
      className={`p-3.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-start gap-3 text-xs leading-relaxed ${className}`}
    >
      <FiShield size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Live AI Verified
          </span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
          This evaluation was processed directly through the Google Gemini AI integration.
        </p>
      </div>
    </div>
  );
};

export default FallbackDisclosure;
