import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Database, Layers3, ListTree, Network, Table2, BarChart3 } from 'lucide-react';
import type { RuntimeLayout, RuntimeLayoutSection } from '../api/views';
import { resolveBinding } from './bindingResolver';
import { useLocale } from '../i18n/context';
import type { Locale } from '../i18n/context';

interface ViewRendererProps {
  layout: RuntimeLayout;
  data: Record<string, any>;
}

// 解析双语字段：值可以是字符串或 {zh, en} 对象
function loc(value: any, locale: Locale): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && (value.zh || value.en)) {
    return locale === 'zh' ? (value.zh || value.en) : (value.en || value.zh);
  }
  return String(value);
}

const toneClasses: Record<string, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  muted: 'text-on-surface-variant',
};

const toneBgClasses: Record<string, string> = {
  primary: 'bg-primary/10 border-primary/20',
  secondary: 'bg-secondary/10 border-secondary/20',
  tertiary: 'bg-tertiary/10 border-tertiary/20',
  muted: 'bg-surface-container border-outline-variant/20',
};

function BlockShell({ title, icon, accent, children }: { title: string; icon: ReactNode; accent?: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden glass-panel rounded-2xl p-5 border border-outline-variant/20 group hover:border-outline-variant/35 transition-colors">
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${accent ? toneBgClasses[accent] : 'bg-primary/10 border-primary/20'}`}>
          <div className={accent ? toneClasses[accent] : 'text-primary'}>{icon}</div>
        </div>
        <h3 className="text-[10px] font-headline font-bold uppercase tracking-[0.18em] text-on-surface-variant/80">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant/25 px-4 py-8 text-center text-sm text-on-surface-variant/50">
      {message}
    </div>
  );
}

function StatusBanner({ value, noDataMsg, locale }: { value: any; noDataMsg: string; locale: Locale }) {
  if (!value) return <EmptyBlock message={noDataMsg} />;
  return (
    <div className="relative overflow-hidden glass-panel rounded-[1.75rem] p-6 md:p-8 border border-primary/20 bg-gradient-to-br from-primary/10 via-surface-container to-surface-container-low">
      <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <p className="relative text-[10px] font-headline uppercase tracking-[0.25em] text-primary/70 mb-2">
        {loc(value.eyebrow, locale) || 'Project View'}
      </p>
      <h1 className="relative text-3xl md:text-4xl font-headline font-black tracking-tight text-on-surface">
        {loc(value.title, locale) || 'Untitled'}
      </h1>
      <p className="relative text-sm md:text-base text-on-surface-variant mt-2 max-w-3xl leading-relaxed">
        {loc(value.subtitle, locale)}
      </p>
      <div className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] font-headline uppercase tracking-wider text-primary">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        {loc(value.status, locale) || 'Ready'}
      </div>
    </div>
  );
}

function MetricGrid({ value, noDataMsg, locale }: { value: any; noDataMsg: string; locale: Locale }) {
  const metrics = Array.isArray(value) ? value : [];
  if (metrics.length === 0) return <EmptyBlock message={noDataMsg} />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {metrics.map((metric: any, index: number) => (
        <motion.div
          key={`${index}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-4 hover:border-outline-variant/30 transition-colors"
        >
          <p className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant/70">
            {loc(metric.label, locale)}
          </p>
          <p className={`mt-2.5 text-2xl font-headline font-black leading-none ${toneClasses[metric.tone || 'muted']}`}>
            {metric.value}
          </p>
          {metric.unit && (
            <p className="mt-1 text-[10px] text-on-surface-variant/50 font-body">{metric.unit}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function ConstraintList({ value, title, noDataMsg }: { value: any; title: string; noDataMsg: string }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <BlockShell title={title} icon={<ListTree size={13} />}>
      {items.length === 0 ? (
        <EmptyBlock message={noDataMsg} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item: any, index: number) => (
            <div
              key={`${item.label}-${index}`}
              className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-primary/10 transition-colors"
            >
              <span className="font-headline text-on-surface">{item.label}</span>
              {item.value && (
                <span className="text-on-surface-variant/70">{item.value}{item.unit ? ` ${item.unit}` : ''}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </BlockShell>
  );
}

function RecordList({ value, title, noDataMsg, locale }: { value: any; title: string; noDataMsg: string; locale: Locale }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <BlockShell title={title} icon={<Database size={13} />} accent="tertiary">
      {items.length === 0 ? (
        <EmptyBlock message={noDataMsg} />
      ) : (
        <div className="space-y-2">
          {items.map((item: any, index: number) => (
            <div
              key={`${index}`}
              className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 hover:border-outline-variant/30 transition-colors"
            >
              <p className="text-sm font-headline font-bold text-on-surface">{loc(item.title, locale) || 'Untitled'}</p>
              {item.meta && <p className="text-xs text-on-surface-variant/70 mt-1 font-body">{loc(item.meta, locale)}</p>}
            </div>
          ))}
        </div>
      )}
    </BlockShell>
  );
}

function EntityTable({ value, title, noDataMsg }: { value: any; title: string; noDataMsg: string }) {
  const rows = Array.isArray(value) ? value : [];
  const columns = rows.length > 0 ? Object.keys(rows[0]).slice(0, 4) : [];
  return (
    <BlockShell title={title} icon={<Table2 size={13} />}>
      {rows.length === 0 || columns.length === 0 ? (
        <EmptyBlock message={noDataMsg} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/15">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-container">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-4 py-2.5 text-[10px] font-headline uppercase tracking-widest text-on-surface-variant/70 border-b border-outline-variant/10">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((row: any, rowIndex: number) => (
                <tr key={rowIndex} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors last:border-0">
                  {columns.map((column) => (
                    <td key={column} className="px-4 py-2.5 text-xs text-on-surface-variant">
                      {String(row[column] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </BlockShell>
  );
}

function AgentPipeline({ value, title, noDataMsg }: { value: any; title: string; noDataMsg: string }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <BlockShell title={title} icon={<Network size={13} />} accent="secondary">
      {items.length === 0 ? (
        <EmptyBlock message={noDataMsg} />
      ) : (
        <div className="space-y-2">
          {items.map((item: any, index: number) => (
            <div
              key={`${item.agent_id}-${index}`}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 hover:border-outline-variant/30 transition-colors"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  item.status === 'completed'
                    ? 'bg-tertiary shadow-[0_0_8px_rgba(var(--color-tertiary)/0.5)]'
                    : item.status === 'failed'
                      ? 'bg-secondary shadow-[0_0_8px_rgba(var(--color-secondary)/0.5)]'
                      : 'bg-primary animate-pulse'
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-headline font-bold text-on-surface truncate">{item.agent_name}</p>
                <p className="text-xs text-on-surface-variant/70 truncate font-body">
                  {(item.findings || []).slice(0, 2).join(' · ') || item.agent_id}
                </p>
              </div>
              <span className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant shrink-0">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </BlockShell>
  );
}

function DetailPanel({ value, summaryLabel, noDataMsg, locale }: { value: any; summaryLabel: string; noDataMsg: string; locale: Locale }) {
  if (!value) return <EmptyBlock message={noDataMsg} />;
  return (
    <BlockShell title={loc(value.title, locale) || summaryLabel} icon={<Layers3 size={13} />}>
      <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
        {loc(value.description, locale)}
      </p>
      <div className="space-y-2">
        {(value.details || []).map((detail: string, index: number) => (
          <div
            key={`${detail}-${index}`}
            className="rounded-lg border-l-2 border-primary/30 bg-surface-container-low pl-3 pr-4 py-2 text-xs text-on-surface-variant"
          >
            {detail}
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

function ChartBar({ value, title, noDataMsg }: { value: any; title: string; noDataMsg: string }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <BlockShell title={title} icon={<BarChart3 size={13} />} accent="primary">
      {items.length === 0 ? (
        <EmptyBlock message={noDataMsg} />
      ) : (
        <div className="space-y-3.5">
          {items.map((item: any, index: number) => {
            const percent = Math.max(0, Math.min(100, Number(item.value) || 0));
            const tone = item.tone || 'primary';
            const barColor = tone === 'secondary' ? 'bg-secondary' : tone === 'tertiary' ? 'bg-tertiary' : 'bg-primary';
            return (
              <div key={`${item.label}-${index}`}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant font-body">{item.label}</span>
                  <span className={`font-headline font-bold ${toneClasses[tone]}`}>{percent}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: index * 0.07 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BlockShell>
  );
}

function sectionClassName(section: RuntimeLayoutSection) {
  if (section.layout === 'grid') return 'grid grid-cols-1 xl:grid-cols-2 gap-5';
  if (section.layout === 'split') return 'grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5';
  return 'flex flex-col gap-5';
}

function renderBlock(type: string, value: any, t: ReturnType<typeof useLocale>['t'], locale: Locale) {
  const nd = (k: string) => t(`viewRenderer.noData.${k}`);
  switch (type) {
    case 'status_banner':
      return <StatusBanner value={value} noDataMsg={nd('banner')} locale={locale} />;
    case 'metric_grid':
      return <MetricGrid value={value} noDataMsg={nd('metrics')} locale={locale} />;
    case 'constraint_list':
      return <ConstraintList value={value} title={t('viewRenderer.constraints')} noDataMsg={nd('constraints')} />;
    case 'record_list':
      return <RecordList value={value} title={t('viewRenderer.records')} noDataMsg={nd('records')} locale={locale} />;
    case 'entity_table':
      return <EntityTable value={value} title={t('viewRenderer.table')} noDataMsg={nd('table')} />;
    case 'agent_pipeline':
      return <AgentPipeline value={value} title={t('viewRenderer.agentPipeline')} noDataMsg={nd('agents')} />;
    case 'detail_panel':
      return <DetailPanel value={value} summaryLabel={t('viewRenderer.summary')} noDataMsg={nd('detail')} locale={locale} />;
    case 'chart_bar':
      return <ChartBar value={value} title={t('viewRenderer.chart')} noDataMsg={nd('chart')} />;
    default:
      return (
        <div className="rounded-xl border border-dashed border-secondary/30 bg-secondary/5 px-4 py-5 text-sm text-secondary">
          {t('viewRenderer.noData.unsupported')}{type}
        </div>
      );
  }
}

export default function ViewRenderer({ layout, data }: ViewRendererProps) {
  const { t, locale } = useLocale();

  if (!layout?.sections?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant/25 px-5 py-10 text-center text-on-surface-variant/50 text-sm">
        {t('viewRenderer.noData.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {layout.sections.map((section) => (
        <section key={section.id} className={sectionClassName(section)}>
          {section.blocks.map((block) => (
            <div key={block.id}>
              {renderBlock(block.type, resolveBinding(data, block.binding), t, locale)}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
