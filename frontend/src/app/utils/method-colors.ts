/**
 * Utility functions for consistent HTTP method badge, text, and select styling across the application.
 */

export function getMethodBadgeClass(method: string | null | undefined): string {
  switch (method?.toUpperCase()) {
    case 'GET':
      return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
    case 'POST':
      return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
    case 'PUT':
      return 'text-blue-400 bg-blue-950/60 border-blue-800/60';
    case 'DELETE':
      return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
    case 'PATCH':
      return 'text-purple-400 bg-purple-950/60 border-purple-800/60';
    case 'HEAD':
      return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
    case 'OPTIONS':
      return 'text-pink-400 bg-pink-950/60 border-pink-800/60';
    case 'TRACE':
      return 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60';
    case 'CONNECT':
      return 'text-teal-400 bg-teal-950/60 border-teal-800/60';
    default:
      return 'text-slate-400 bg-slate-800/60 border-slate-700/60';
  }
}

export function getMethodSelectClass(method: string | null | undefined): string {
  switch (method?.toUpperCase()) {
    case 'GET':
      return 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80 hover:bg-emerald-950';
    case 'POST':
      return 'text-amber-400 bg-amber-950/80 border-amber-800/80 hover:bg-amber-950';
    case 'PUT':
      return 'text-blue-400 bg-blue-950/80 border-blue-800/80 hover:bg-blue-950';
    case 'DELETE':
      return 'text-rose-400 bg-rose-950/80 border-rose-800/80 hover:bg-rose-950';
    case 'PATCH':
      return 'text-purple-400 bg-purple-950/80 border-purple-800/80 hover:bg-purple-950';
    case 'HEAD':
      return 'text-cyan-400 bg-cyan-950/80 border-cyan-800/80 hover:bg-cyan-950';
    case 'OPTIONS':
      return 'text-pink-400 bg-pink-950/80 border-pink-800/80 hover:bg-pink-950';
    case 'TRACE':
      return 'text-indigo-400 bg-indigo-950/80 border-indigo-800/80 hover:bg-indigo-950';
    case 'CONNECT':
      return 'text-teal-400 bg-teal-950/80 border-teal-800/80 hover:bg-teal-950';
    default:
      return 'text-slate-300 bg-slate-800 border-slate-700';
  }
}

export function getMethodTextColorClass(method: string | null | undefined): string {
  switch (method?.toUpperCase()) {
    case 'GET':
      return 'text-emerald-400';
    case 'POST':
      return 'text-amber-400';
    case 'PUT':
      return 'text-blue-400';
    case 'DELETE':
      return 'text-rose-400';
    case 'PATCH':
      return 'text-purple-400';
    case 'HEAD':
      return 'text-cyan-400';
    case 'OPTIONS':
      return 'text-pink-400';
    case 'TRACE':
      return 'text-indigo-400';
    case 'CONNECT':
      return 'text-teal-400';
    default:
      return 'text-slate-400';
  }
}

export function getMethodShort(method: string | null | undefined): string {
  if (!method) return 'REQ';
  const m = method.toUpperCase();
  if (m === 'DELETE') return 'DEL';
  if (m === 'OPTIONS') return 'OPT';
  if (m === 'PATCH') return 'PAT';
  return m;
}
