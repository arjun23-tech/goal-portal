import { Target, Scale, Hash, Lock, ChevronRight, Pencil, Trash2 } from 'lucide-react'

const STATUS_BADGE = {
  draft: 'badge-draft',
  submitted: 'badge-submitted',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
}

export default function GoalCard({ goal, onEdit, onDelete, onUpdate, showEmployee }) {
  const isLocked = goal.status === 'approved' || goal.status === 'submitted'

  return (
    <div className="card p-5 hover:border-slate-700/80 transition-all duration-200 group animate-slide-up">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={STATUS_BADGE[goal.status] || 'badge-draft'}>{goal.status}</span>
            {showEmployee && goal.employee && (
              <span className="text-xs text-slate-500 font-mono">{goal.employee.full_name}</span>
            )}
          </div>
          <h3 className="font-semibold text-white leading-snug group-hover:text-ink-300 transition-colors">{goal.title}</h3>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-ink-400 font-mono">{goal.weightage}%</div>
          <div className="text-xs text-slate-500">weight</div>
        </div>
      </div>

      {goal.description && (
        <p className="text-sm text-slate-400 mb-3 leading-relaxed">{goal.description}</p>
      )}

      <div className="flex flex-wrap gap-3 text-xs mb-3">
        <div className="flex items-center gap-1.5 bg-slate-800/60 rounded-lg px-3 py-1.5">
          <Target className="w-3 h-3 text-ink-400" />
          <span className="text-slate-400">Target:</span>
          <span className="text-white font-semibold">{goal.target}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-800/60 rounded-lg px-3 py-1.5">
          <Hash className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400">UoM:</span>
          <span className="text-white font-semibold">{goal.uom}</span>
        </div>
        {goal.status === 'approved' && <div className="flex items-center gap-1.5 bg-emerald-500/10 rounded-lg px-3 py-1.5">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400 font-medium">Locked</span>
        </div>}
      </div>

      {goal.rejection_reason && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
          <span className="font-semibold">Rejection reason:</span> {goal.rejection_reason}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-slate-800/60">
        {onUpdate && goal.status === 'approved' && (
          <button onClick={() => onUpdate(goal)}
            className="flex items-center gap-1.5 btn-ghost text-xs py-1.5 px-3">
            <ChevronRight className="w-3.5 h-3.5" />Quarterly Update
          </button>
        )}
        {onEdit && !isLocked && (
          <button onClick={() => onEdit(goal)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs py-1.5 px-3 rounded-lg hover:bg-slate-800/60 transition-all">
            <Pencil className="w-3.5 h-3.5" />Edit
          </button>
        )}
        {onDelete && goal.status === 'draft' && (
          <button onClick={() => onDelete(goal)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-xs py-1.5 px-3 rounded-lg hover:bg-red-500/10 transition-all">
            <Trash2 className="w-3.5 h-3.5" />Delete
          </button>
        )}
      </div>
    </div>
  )
}
