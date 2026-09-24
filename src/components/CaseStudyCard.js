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

const ArrowGlyph = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" className="w-4 h-4">
    <path d="M5 3H13V11"/>
    <path d="M13 3L4 12"/>
  </svg>
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

  return (
    <article className="card relative flex flex-col bg-[#0C0D0D] border border-[rgba(139,92,246,0.4)] overflow-hidden hover:border-[#8B5CF6] focus-within:outline focus-within:outline-2 focus-within:outline-[rgba(139,92,246,0.55)] focus-within:outline-offset-2 transition-colors">
      {/* Corner brackets */}
      <span className="bracket-tl absolute top-[6px] left-[6px] w-[18px] h-[18px] border-t-[1.5px] border-l-[1.5px] border-[rgba(139,92,246,0.85)] pointer-events-none z-[5]"></span>
      <span className="bracket-br absolute bottom-[6px] right-[6px] w-[18px] h-[18px] border-b-[1.5px] border-r-[1.5px] border-[rgba(255,255,255,0.45)] pointer-events-none z-[5]"></span>

      <Link
        to={fromCollection ? `/project/${project.slug}/?from=collection` : `/project/${project.slug}/`}
        state={fromCollection ? { fromCollection: true } : undefined}
        className="block focus:outline-none"
        aria-label={`Read case study: ${project.cardTitle || project.title}`}
        onClickCapture={onClickCapture}
        onPointerDownCapture={onPointerDownCapture}
        onAuxClickCapture={onAuxClickCapture}
      >
        {/* Media area */}
        <div className="media relative min-h-[300px] bg-[#111] overflow-hidden">
          {project.image && (
            <img
              className="absolute inset-0 w-full h-full object-cover block"
              alt={project.image.alt}
              src={project.image.src}
              width={project.image.width}
              height={project.image.height}
              loading="lazy"
            />
          )}
          <div className="scrim absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(12,13,13,0.35)] to-[rgba(12,13,13,0.92)] z-[1]"></div>
          <div className="media-meta absolute left-4 right-14 bottom-4 z-[2]">
            {project.category && (
              <div className="cat inline-block font-mono text-[10px] tracking-[0.12em] uppercase text-[#d8caff] pb-[6px] mb-[10px] border-b border-[rgba(139,92,246,0.45)]">
                {project.category.toUpperCase()} · <em className="not-italic text-[#a78bfa]">CASE STUDY</em>
              </div>
            )}
            <h3 className="text-[1.05rem] font-[650] tracking-[-0.015em] leading-[1.3] text-white">
              {project.cardTitle || project.title}
            </h3>
          </div>
          <span className="glyph-hit absolute right-3 bottom-3 z-[3] w-11 h-11 grid place-items-center text-[#d8caff] border border-[rgba(139,92,246,0.35)] bg-[rgba(12,13,13,0.55)]">
            <ArrowGlyph />
          </span>
        </div>
      </Link>

      {/* Body */}
      <div className="body p-5 flex flex-col gap-4 flex-1">
        <p className="summary text-[0.875rem] leading-[1.5] text-[#9ca3af]">
          {project.summary}
        </p>
        <div className="fields flex flex-wrap items-baseline justify-between gap-2 gap-x-4 pt-[10px] border-t border-[rgba(255,255,255,0.06)] mt-auto">
          {upworkLink ? (
            <a
              href={upworkLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="field font-mono text-[11px] leading-[1.3] tracking-[0.04em] text-[#6b7280]"
            >
              <span className="text-[#a78bfa] border-b border-[rgba(167,139,250,0.35)] hover:text-white hover:border-[#8B5CF6]">
                Upwork project
              </span>
            </a>
          ) : null}
          {completionDate && (
            <time
              dateTime={project.completedAt}
              aria-label={`Completed ${completionDate}`}
              className="field font-mono text-[11px] leading-[1.3] tracking-[0.04em] text-[#6b7280] ml-auto"
            >
              Completed <span className="text-[#9ca3af]">{completionDate}</span>
            </time>
          )}
        </div>
      </div>
    </article>
  );
};

export default CaseStudyCard;
