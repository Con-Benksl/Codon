import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Database, Layers3, ListTree, Network, Table2 } from 'lucide-react';
import type { RuntimeLayout, RuntimeLayoutBlock, RuntimeLayoutSection } from '../api/views';
import { resolveBinding } from './bindingResolver';

interface ViewRendererProps {
  layout: RuntimeLayout;
  data: Record<string, any>;
}

const toneClasses: Record<string, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  muted: 'text-on-surface-variant',
};

function BlockShell({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-outline-variant/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-primary">{icon}</div>
        <h3 className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant/25 px-4 py-6 text-sm text-on-surface-variant/70">
      {message}
    </div>
  );
}

function renderStatusBanner(value: any) {
  if (!value) return <EmptyBlock message="No banner data" />;
  return (
    <div className="glass-panel rounded-[1.75rem] p-6 md:p-8 border border-primary/20 bg-gradient-to-br from-primary/10 via-surface-container to-surface-container-low">
      <p className="text-[10px] font-headline uppercase tracking-[0.25em] text-primary/70 mb-2">
        {value.eyebrow || 'Project View'}
      </p>
      <h1 className="text-3xl md:text-4xl font-headline font-black tracking-tight text-on-surface">
        {value.title || 'Untitled'}
      </h1>
      <p className="text-sm md:text-base text-on-surface-variant mt-2 max-w-3xl">
        {value.subtitle || ''}
      </p>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-headline uppercase tracking-wider text-primary">
        <span className="h-2 w-2 rounded-full bg-primary" />
        {value.status || 'Ready'}
      </p>
    </div>
  );
}

function renderMetricGrid(value: any) {
  const metrics = Array.isArray(value) ? value : [];
  if (metrics.length === 0) return <EmptyBlock message="No metrics available" />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {metrics.map((metric: any, index: number) => (
        <motion.div
          key={`${metric.label}-${index}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4"
        >
          <p className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
            {metric.label}
          </p>
          <p className={`mt-2 text-2xl font-headline font-black ${toneClasses[metric.tone || 'muted']}`}>
            {metric.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

function renderConstraintList(value: any) {
  const items = Array.isArray(value) ? value : [];
  return (
    <BlockShell title="Constraints" icon={<ListTree size={14} />}>
      {items.length === 0 ? (
        <EmptyBlock message="No constraints available" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item: any, index: number) => (
            <div key={`${item.label}-${index}`} className="rounded-full border border-outline-variant/20 bg-surface-container px-3 py-2 text-xs">
              <span className="font-headline text-on-surface">{item.label}</span>
              {item.value ? <span className="ml-2 text-on-surface-variant">{item.value}{item.unit ? ` ${item.unit}` : ''}</span> : null}
            </div>
          ))}
        </div>
      )}
    </BlockShell>
  );
}

function renderRecordList(value: any) {
  const items = Array.isArray(value) ? value : [];
  return (
    <BlockShell title="Records" icon={<Database size={14} />}>
      {items.length === 0 ? (
        <EmptyBlock message="No records available" />
      ) : (
        <div className="space-y-2">
          {items.map((item: any, index: number) => (
            <div key={`${item.title}-${index}`} className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3">
              <p className="text-sm font-headline font-bold text-on-surface">{item.title || 'Untitled'}</p>
              <p className="text-xs text-on-surface-variant mt-1">{item.meta || ''}</p>
            </div>
          ))}
        </div>
      )}
    </BlockShell>
  );
}

function renderEntityTable(value: any) {
  const rows = Array.isArray(value) ? value : [];
  const columns = rows.length > 0 ? Object.keys(rows[0]).slice(0, 4) : [];
  return (
    <BlockShell title="Table" icon={<Table2 size={14} />}>
      {rows.length === 0 || columns.length === 0 ? (
        <EmptyBlock message="No tabular data available" />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/15">
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2 text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((row: any, rowIndex: number) => (
                <tr key={rowIndex} className="border-b border-outline-variant/10">
                  {columns.map((column) => (
                    <td key={column} className="px-3 py-2 text-xs text-on-surface-variant">
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

function renderAgentPipeline(value: any) {
  const items = Array.isArray(value) ? value : [];
  return (
    <BlockShell title="Agent Pipeline" icon={<Network size={14} />}>
      {items.length === 0 ? (
        <EmptyBlock message="No agent runs available" />
      ) : (
        <div className="space-y-2">
          {items.map((item: any, index: number) => (
            <div key={`${item.agent_id}-${index}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3">
              <span className={`h-2.5 w-2.5 rounded-full ${item.status === 'completed' ? 'bg-tertiary' : item.status === 'failed' ? 'bg-secondary' : 'bg-primary'}`} />
              <div className="min-w-0">
                <p className="text-sm font-headline font-bold text-on-surface truncate">{item.agent_name}</p>
                <p className="text-xs text-on-surface-variant truncate">
                  {(item.findings || []).slice(0, 2).join(' • ') || item.agent_id}
                </p>
              </div>
              <span className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </BlockShell>
  );
}

function renderDetailPanel(value: any) {
  if (!value) return <EmptyBlock message="No detail payload" />;
  return (
    <BlockShell title={value.title || 'Summary'} icon={<Layers3 size={14} />}>
      <p className="text-sm text-on-surface-variant leading-relaxed">
        {value.description || 'No description'}
      </p>
      <div className="mt-4 space-y-2">
        {(value.details || []).map((detail: string, index: number) => (
          <div key={`${detail}-${index}`} className="rounded-lg border border-outline-variant/15 bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
            {detail}
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

function renderChartBar(value: any) {
  const items = Array.isArray(value) ? value : [];
  return (
    <BlockShell title="Chart" icon={<Layers3 size={14} />}>
      {items.length === 0 ? (
        <EmptyBlock message="No chart points available" />
      ) : (
        <div className="space-y-3">
          {items.map((item: any, index: number) => {
            const percent = Math.max(0, Math.min(100, Number(item.value) || 0));
            return (
              <div key={`${item.label}-${index}`}>
                <div className="mb-1 flex items-center justify-between text-xs text-on-surface-variant">
                  <span>{item.label}</span>
                  <span>{percent}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BlockShell>
  );
}

function renderFallback(type: string) {
  return (
    <div className="rounded-xl border border-dashed border-secondary/30 bg-secondary/5 px-4 py-5 text-sm text-secondary">
      Unsupported block type: {type}
    </div>
  );
}

function renderBlock(type: string, value: any) {
  switch (type) {
    case 'status_banner':
      return renderStatusBanner(value);
    case 'metric_grid':
      return renderMetricGrid(value);
    case 'constraint_list':
      return renderConstraintList(value);
    case 'record_list':
      return renderRecordList(value);
    case 'entity_table':
      return renderEntityTable(value);
    case 'agent_pipeline':
      return renderAgentPipeline(value);
    case 'detail_panel':
      return renderDetailPanel(value);
    case 'chart_bar':
      return renderChartBar(value);
    default:
      return renderFallback(type);
  }
}

function sectionClassName(section: RuntimeLayoutSection) {
  if (section.layout === 'grid') {
    return 'grid grid-cols-1 xl:grid-cols-2 gap-5';
  }
  if (section.layout === 'split') {
    return 'grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5';
  }
  return 'flex flex-col gap-5';
}

export default function ViewRenderer({ layout, data }: ViewRendererProps) {
  if (!layout?.sections?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant/25 px-5 py-8 text-on-surface-variant">
        Empty layout
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {layout.sections.map((section) => (
        <section key={section.id} className={sectionClassName(section)}>
          {section.blocks.map((block) => (
            <div key={block.id}>
              {renderBlock(block.type, resolveBinding(data, block.binding))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
