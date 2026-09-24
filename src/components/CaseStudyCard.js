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
    { className: 'group relative flex h-full flex-col overflow-hidden rounded-none border border-[#8B5CF6]/40 bg-[#0C0D0D] transition-colors hover:border-[#8B5CF6] focus-within:ring-2 focus-within:ring-accent-purple' },
    React.createElement('span', { className: 'absolute top-1.5 left-1.5 w-[18px] h-[18px] pointer-events-none z-10 before:content-[""] before:absolute before:top-0 before:left-0 before:w-[14px] before:h-[14px] before:border-t-[1.5px] before:border-l-[1.5px] before:border-[#8B5CF6]/85', 'aria-hidden': true }),
    React.createElement('span', { className: 'absolute bottom-1.5 right-1.5 w-[18px] h-[18px] pointer-events-none z-10 before:content-[""] before:absolute before:bottom-0 before:right-0 before:w-[14px] before:h-[14px] before:border-b-[1.5px] before:border-r-[1.5px] before:border-white/45', 'aria-hidden': true }),
    React.createElement(
      Link,
      {
        to: fromCollection ? `/project/${project.slug}/?from=collection` : `/project/${project.slug}/`,
        state: fromCollection ? { fromCollection: true } : undefined,
        className: 'block focus:outline-none after:absolute after:inset-0 after:content-[" "]',
        'aria-label': `Read case study: ${project.cardTitle || project.title}`,
        onClickCapture,
        onPointerDownCapture,
        onAuxClickCapture,
      },
      React.createElement(
        'div',
        { className: 'relative flex min-h-[320px] items-end bg-[#19191f] p-5' },
        project.image ? React.createElement('img', {
          className: 'absolute inset-0 h-full w-full object-cover',
          alt: project.image.alt, src: project.image.src,
          width: project.image.width, height: project.image.height, loading: 'lazy',
        }) : null,
        React.createElement('div', { className: 'absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent', 'aria-hidden': true }),
        React.createElement(
          'div', { className: 'relative flex w-full items-end gap-4' },
          React.createElement(
            'div', { className: 'min-w-0 flex-1' },
            project.category ? React.createElement('div', { className: 'mb-2.5 inline-block pb-1.5 border-b border-[#8B5CF6]/45 text-[10px] font-mono tracking-[0.12em] uppercase leading-none text-[#d8caff]' }, project.category, ' · ', React.createElement('span', { className: 'text-[#a78bfa]' }, 'CASE STUDY')) : null,
            React.createElement('h3', { className: 'break-words text-xl font-bold leading-tight text-white' }, project.cardTitle || project.title),
          ),
          React.createElement('span', { className: 'flex h-11 w-11 shrink-0 items-center justify-center border border-[#8B5CF6]/35 bg-[#0C0D0D]/55 text-[#d8caff]', 'aria-hidden': true }, 
            React.createElement('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'square', className: 'w-4 h-4' },
              React.createElement('path', { d: 'M5 3H13V11' }),
              React.createElement('path', { d: 'M13 3L4 12' })
            )
          ),
        ),
      ),
    ),
    React.createElement(
      'div', { className: 'flex flex-1 flex-col gap-4 p-5' },
      React.createElement('p', { className: 'break-words text-sm leading-relaxed text-gray-400' }, project.summary),
      React.createElement(
        'div', { className: 'mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2' },
        upworkLink ? React.createElement('a', {
          href: upworkLink.href, target: '_blank', rel: 'noopener noreferrer',
          className: 'relative z-10 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-purple-text hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-purple',
        }, 'Upwork project', React.createElement('span', { 'aria-hidden': true }, '↗'))
          : React.createElement('span', { className: 'inline-flex min-h-11 items-center text-sm font-semibold text-accent-purple-text' }, 'Read case study →'),
        completionDate ? React.createElement('time', {
          dateTime: project.completedAt, 'aria-label': `Completed ${completionDate}`,
          className: 'ml-auto shrink-0 text-right text-xs leading-tight text-gray-400',
        }, React.createElement('span', { className: 'block' }, 'Completed'), React.createElement('span', { className: 'block text-sm text-white' }, completionDate)) : null,
      ),
    ),
  );
};

export default CaseStudyCard;
