import React from 'react';
import { Link } from 'react-router-dom';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const formatCompletionDate = (completedAt) => {
  const match = typeof completedAt === 'string' ? completedAt.match(/^(\d{4})-(0[1-9]|1[0-2])$/) : null;
  if (!match) return null;

  const [, year, month] = match;
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
};

const ArrowGlyph = () => 
  React.createElement('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'square', className: 'w-4 h-4' },
    React.createElement('path', { d: 'M5 3H13V11' }),
    React.createElement('path', { d: 'M13 3L4 12' })
  );

const CaseStudyCard = ({
  project,
  fromCollection = false,
  onClickCapture,
  onPointerDownCapture,
  onAuxClickCapture,
}) => {
  const completionDate = formatCompletionDate(project.completedAt);
  const upworkLink = project.externalLinks?.find((link) => link.label === 'Upwork project');

  return React.createElement(
    'article',
    { className: 'card relative flex flex-col bg-[#0C0D0D] border border-[rgba(139,92,246,0.4)] overflow-hidden hover:border-[#8B5CF6] focus-within:outline focus-within:outline-2 focus-within:outline-[rgba(139,92,246,0.55)] focus-within:outline-offset-2 transition-colors' },
    React.createElement('span', { className: 'bracket-tl absolute top-[6px] left-[6px] w-[18px] h-[18px] border-t-[1.5px] border-l-[1.5px] border-[rgba(139,92,246,0.85)] pointer-events-none z-[5]' }),
    React.createElement('span', { className: 'bracket-br absolute bottom-[6px] right-[6px] w-[18px] h-[18px] border-b-[1.5px] border-r-[1.5px] border-[rgba(255,255,255,0.45)] pointer-events-none z-[5]' }),
    React.createElement(
      Link,
      {
        to: fromCollection ? `/project/${project.slug}/?from=collection` : `/project/${project.slug}/`,
        state: fromCollection ? { fromCollection: true } : undefined,
        className: 'block focus:outline-none',
        'aria-label': `Read case study: ${project.cardTitle || project.title}`,
        onClickCapture,
        onPointerDownCapture,
        onAuxClickCapture,
      },
      React.createElement(
        'div',
        { className: 'media relative min-h-[300px] bg-[#111] overflow-hidden' },
        project.image ? React.createElement('img', {
          className: 'absolute inset-0 w-full h-full object-cover block',
          alt: project.image.alt, src: project.image.src,
          width: project.image.width, height: project.image.height, loading: 'lazy',
        }) : null,
        React.createElement('div', { className: 'scrim absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(12,13,13,0.35)] to-[rgba(12,13,13,0.92)] z-[1]', 'aria-hidden': true }),
        React.createElement(
          'div',
          { className: 'media-meta absolute left-4 right-14 bottom-4 z-[2]' },
          project.category ? React.createElement('div', { className: 'cat inline-block font-mono text-[10px] tracking-[0.12em] uppercase text-[#d8caff] pb-[6px] mb-[10px] border-b border-[rgba(139,92,246,0.45)]' },
            project.category.toUpperCase(),
            ' · ',
            React.createElement('em', { className: 'not-italic text-[#a78bfa]' }, 'CASE STUDY')
          ) : null,
          React.createElement('h3', { className: 'text-[1.05rem] font-[650] tracking-[-0.015em] leading-[1.3] text-white' }, project.cardTitle || project.title),
        ),
        React.createElement('span', { className: 'glyph-hit absolute right-3 bottom-3 z-[3] w-11 h-11 grid place-items-center text-[#d8caff] border border-[rgba(139,92,246,0.35)] bg-[rgba(12,13,13,0.55)]', 'aria-hidden': true }, React.createElement(ArrowGlyph)),
      ),
    ),
    React.createElement(
      'div',
      { className: 'body p-5 flex flex-col gap-4 flex-1' },
      React.createElement('p', { className: 'summary text-[0.875rem] leading-[1.5] text-[#9ca3af]' }, project.summary),
      React.createElement(
        'div',
        { className: 'fields flex flex-wrap items-baseline justify-between gap-2 gap-x-4 pt-[10px] border-t border-[rgba(255,255,255,0.06)] mt-auto' },
        upworkLink ? React.createElement('a', {
          href: upworkLink.href, target: '_blank', rel: 'noopener noreferrer',
          className: 'field font-mono text-[11px] leading-[1.3] tracking-[0.04em] text-[#6b7280]',
        }, React.createElement('span', { className: 'text-[#a78bfa] border-b border-[rgba(167,139,250,0.35)] hover:text-white hover:border-[#8B5CF6]' }, 'Upwork project')) : null,
        completionDate ? React.createElement('time', {
          dateTime: project.completedAt, 'aria-label': `Completed ${completionDate}`,
          className: 'field font-mono text-[11px] leading-[1.3] tracking-[0.04em] text-[#6b7280] ml-auto',
        }, 'Completed ', React.createElement('span', { className: 'text-[#9ca3af]' }, completionDate)) : null,
      ),
    ),
  );
};

export default CaseStudyCard;
