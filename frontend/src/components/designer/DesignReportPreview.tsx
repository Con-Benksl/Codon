import { AlertCircle, Download, FileText, RefreshCw } from 'lucide-react';
import type { DesignReport, DesignReportSection } from '../../api/designer';

interface DesignReportPreviewProps {
  report: DesignReport | null;
  loading: boolean;
  error: string | null;
  exporting: boolean;
  onRefresh: () => void;
  onExportMarkdown: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  updating: '更新中',
  complete: '已完成',
  completed: '已完成',
  publishable: '可发布',
  published: '已发布',
  failed: '失败',
  empty: '待生成',
  updated: '已更新',
  edited: '已编辑',
  stale: '需刷新',
};

const statusTone = (status?: string | null) => {
  switch (status) {
    case 'complete':
    case 'publishable':
    case 'published':
    case 'updated':
    case 'edited':
      return 'border-primary/30 bg-primary/10 text-primary';
    case 'failed':
      return 'border-red-400/30 bg-red-500/10 text-red-300';
    case 'stale':
    case 'updating':
      return 'border-amber-300/30 bg-amber-400/10 text-amber-200';
    default:
      return 'border-white/15 bg-white/[0.04] text-text-muted';
  }
};

const formatTimestamp = (value?: string | null) => {
  if (!value) return '尚未更新';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

function SectionRow({ section }: { section: DesignReportSection; key?: string }) {
  const label = STATUS_LABEL[section.status] ?? section.status;
  return (
    <li className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-text">{section.title}</div>
          <div className="mt-1 text-xs text-text-dim">
            {section.source_step ? `Step ${section.source_step} · ` : ''}
            {formatTimestamp(section.updated_at)}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${statusTone(
            section.status,
          )}`}
        >
          {label}
        </span>
      </div>
      {section.content ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-muted">
          {section.content}
        </p>
      ) : null}
    </li>
  );
}

export default function DesignReportPreview({
  report,
  loading,
  error,
  exporting,
  onRefresh,
  onExportMarkdown,
}: DesignReportPreviewProps) {
  const reportStatus = report ? STATUS_LABEL[report.status] ?? report.status : '未生成';
  const shouldShowBody = Boolean(error || loading || report);

  return (
    <section className="rounded-xl border border-white/15 bg-surface/80">
      <header className={shouldShowBody ? 'border-b border-white/10 px-4 py-3' : 'px-4 py-3'}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-text">方案报告</h2>
              <p className="mt-1 text-xs text-text-dim">
                {report ? report.title : '随设计步骤持续生成的报告预览'}
              </p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(report?.status)}`}>
            {loading ? '读取中' : reportStatus}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:border-primary/30 hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
          <button
            type="button"
            onClick={onExportMarkdown}
            disabled={exporting || !report}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} />
            {exporting ? '导出中' : 'Markdown 导出'}
          </button>
        </div>
      </header>

      {shouldShowBody ? (
      <div className="px-4 py-3">
        {error ? (
          <div className="mb-4 rounded-lg border border-amber-300/25 bg-amber-400/10 px-3 py-3 text-xs leading-relaxed text-amber-100">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <AlertCircle size={14} />
              报告预览暂不可用
            </div>
            {error}
          </div>
        ) : null}

        {report?.summary ? (
          <p className="mb-4 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-3 text-xs leading-relaxed text-text-muted">
            {report.summary}
          </p>
        ) : null}

        {report?.sections.length ? (
          <ul className="space-y-2">
            {report.sections.map((section) => (
              <SectionRow key={section.id} section={section} />
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 px-3 py-3 text-center text-xs leading-relaxed text-text-dim">
            {loading ? '正在读取报告章节...' : '完成任一步骤后，这里会显示报告章节状态。'}
          </div>
        )}

        {report?.updated_at ? (
          <div className="mt-3 text-right text-[11px] text-text-dim">
            更新时间 {formatTimestamp(report.updated_at)}
          </div>
        ) : null}
      </div>
      ) : null}
    </section>
  );
}
