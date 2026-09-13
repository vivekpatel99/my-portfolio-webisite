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
    { className: 'group relative flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition-colors hover:border-accent-purple/50 focus-within:ring-2 focus-within:ring-accent-purple' },
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
            project.category ? React.createElement('p', { className: 'mb-4 inline-block rounded-full border border-accent-purple/30 bg-accent-purple/15 px-3 py-1 text-xs font-semibold uppercase leading-tight text-[#d8caff]' }, project.category) : null,
            React.createElement('h3', { className: 'break-words text-xl font-bold leading-tight text-white' }, project.cardTitle || project.title),
          ),
          React.createElement('span', { className: 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors group-hover:bg-accent-purple/60', 'aria-hidden': true }, '↗'),
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
          className: 'relative z-10 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-purple hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-purple',
        }, 'Upwork project', React.createElement('span', { 'aria-hidden': true }, '↗'))
          : React.createElement('span', { className: 'inline-flex min-h-11 items-center text-sm font-semibold text-accent-purple' }, 'Read case study →'),
        completionDate ? React.createElement('time', {
          dateTime: project.completedAt, 'aria-label': `Completed ${completionDate}`,
          className: 'ml-auto shrink-0 text-right text-xs leading-tight text-gray-400',
        }, React.createElement('span', { className: 'block' }, 'Completed'), React.createElement('span', { className: 'block text-sm text-white' }, completionDate)) : null,
      ),
    ),
  );
};

export default CaseStudyCard;
