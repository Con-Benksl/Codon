import type { RuntimeLayout } from '../api/views';

const SUPPORTED_BLOCK_TYPES = new Set([
  'metric_grid',
  'status_banner',
  'constraint_list',
  'entity_table',
  'timeline',
  'chart_line',
  'chart_bar',
  'agent_pipeline',
  'record_list',
  'detail_panel',
  'cta_group',
  'text_block',
]);

export const validateRuntimeSchema = (layout: RuntimeLayout) => {
  if (!Array.isArray(layout.sections)) return false;

  return layout.sections.every((section) => {
    if (!['stack', 'grid', 'split'].includes(section.layout)) return false;
    return section.blocks.every((block) => SUPPORTED_BLOCK_TYPES.has(block.type));
  });
};
