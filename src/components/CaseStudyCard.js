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
  const image = project.image
    ? React.createElement('img', {
      className: 'block h-auto w-full',
      alt: project.image.alt,
      src: project.image.src,
      width: project.image.width,
      height: project.image.height,
      loading: 'lazy',
    })
    : null;

  return React.createElement(
    'article',
    { className: 'h-full' },
    React.createElement(
      Link,
      {
        to: fromCollection ? `/project/${project.slug}/?from=collection` : `/project/${project.slug}/`,
        state: fromCollection ? { fromCollection: true } : undefined,
        className: 'group flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-accent-purple/50 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C0D0D]',
        'aria-label': `Read case study: ${project.title}`,
        onClickCapture,
        onPointerDownCapture,
        onAuxClickCapture,
      },
      image,
      React.createElement(
        'div',
        { className: 'flex min-h-[148px] flex-1 flex-col justify-between gap-4 p-5' },
        React.createElement(
          'div',
          null,
          project.category
            ? React.createElement('p', { className: 'mb-3 text-xs font-semibold uppercase tracking-wide text-[#d8caff]' }, project.category)
            : null,
          React.createElement('h3', { className: 'break-words text-xl font-bold leading-tight text-white' }, project.title),
          React.createElement('p', { className: 'mt-3 break-words text-sm leading-relaxed text-gray-400' }, project.summary),
        ),
        React.createElement(
          'div',
          { className: 'flex flex-wrap items-end justify-between gap-x-4 gap-y-2' },
          React.createElement(
            'span',
            { className: 'inline-flex min-h-11 items-center text-sm font-semibold text-accent-purple group-hover:text-white' },
            'Read case study →',
          ),
          completionDate
            ? React.createElement(
              'time',
              {
                dateTime: project.completedAt,
                'aria-label': `Completed ${completionDate}`,
                className: 'ml-auto shrink-0 text-right text-xs leading-tight text-gray-400',
              },
              React.createElement('span', { className: 'block' }, 'Completed'),
              React.createElement('span', { className: 'block text-sm text-white' }, completionDate),
            )
            : null,
        ),
      ),
    ),
  );
};

export default CaseStudyCard;
