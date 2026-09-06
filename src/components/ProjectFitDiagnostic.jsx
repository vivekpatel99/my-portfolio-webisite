import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { classifyProjectFit } from '@/lib/projectFitDiagnostic';

const QUESTIONS = [
  {
    id: 'projectType',
    legend: 'What kind of project are you considering?',
    options: [
      ['document-web-extraction', 'Document or web data extraction'],
      ['workflow-automation', 'Workflow automation, including fragile n8n or AI workflows'],
      ['computer-vision', 'Computer vision, including a slow or unreliable pipeline'],
      ['out-of-scope', 'Something outside these published areas'],
    ],
  },
  {
    id: 'sourceAccess',
    legend: 'Can the relevant source material or system access be made available for review?',
    options: [
      ['available', 'Yes, usable source material or access is available'],
      ['unclear', 'Not yet — access needs to be clarified'],
      ['missing', 'No source material or access is available'],
    ],
  },
  {
    id: 'outputContract',
    legend: 'Is the information needed and where it should go clear?',
    hint: 'For example, the fields to extract and where they should be sent, or what happens when a workflow cannot continue.',
    options: [
      ['clear', 'Yes, the needed information and where it should go are clear'],
      ['unclear', 'Not yet — the information or next step needs to be clarified'],
    ],
  },
  {
    id: 'expectation',
    legend: 'What result are you expecting?',
    options: [
      ['bounded', 'A practical assessment and workflow that can be tested and reviewed'],
      ['guaranteed', 'A guaranteed level of accuracy, saving, or business result'],
      ['unclear', 'I am not sure yet — the practical outcome needs to be discussed'],
    ],
  },
  {
    id: 'humanReview',
    legend: 'Who will check exceptions and business decisions?',
    options: [
      ['included', 'A person will review exceptions and business decisions'],
      ['none', 'No person will review them before a decision is made'],
      ['unclear', 'I am not sure yet who will review exceptions and business decisions'],
    ],
  },
];

const buttonClass = 'min-h-11 rounded-full px-5 py-3 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple focus-visible:ring-offset-4 focus-visible:ring-offset-[#0C0D0D]';

const proofLabel = ({ id, scope, title }) => `${title || id.replaceAll('-', ' ')}${scope ? `: ${scope}` : ''}`;

const ProjectFitDiagnostic = () => {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const startButtonRef = useRef(null);
  const questionHeadingRef = useRef(null);
  const resultHeadingRef = useRef(null);

  useEffect(() => {
    const target = focusTarget === 'start'
      ? startButtonRef.current
      : focusTarget === 'question'
        ? questionHeadingRef.current
        : focusTarget === 'result'
          ? resultHeadingRef.current
          : null;

    if (target) {
      target.scrollIntoView?.({ block: 'start' });
      target.focus();
    }
    if (focusTarget) setFocusTarget(null);
  }, [focusTarget, step]);

  const goToStep = (nextStep, nextFocusTarget) => {
    setFocusTarget(nextFocusTarget);
    setStep(nextStep);
  };

  const restart = () => {
    setAnswers({});
    goToStep(null, 'start');
  };

  const question = step === null ? null : QUESTIONS[step];
  const isComplete = step === QUESTIONS.length;
  const result = isComplete ? classifyProjectFit(answers) : null;

  const selectAnswer = (value) => {
    setAnswers((current) => ({ ...current, [question.id]: value }));
  };

  return (
    <section id="project-fit-diagnostic" className="sentry-block sentry-ignore bg-[#121316] py-24" aria-labelledby="project-fit-heading">
      <div className="container mx-auto max-w-4xl px-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#d8caff]">Scope check</p>
          <h2 id="project-fit-heading" className="mt-3 text-3xl font-bold uppercase leading-tight text-white md:text-4xl">Project Fit Diagnostic</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">Your answers stay only in this page. They reset if you leave or reload, and nothing is submitted.</p>

          {step === null && (
            <div className="mt-5 max-w-2xl">
              <p className="text-base leading-relaxed text-gray-300">Answer five practical questions to see how a request aligns with the published document, workflow, and computer-vision scope. This is a transparent scope check, not a promise or a submission.</p>
              <button ref={startButtonRef} type="button" className={`scroll-mt-28 mt-6 bg-accent-purple text-white hover:bg-accent-purple/90 ${buttonClass}`} onClick={() => goToStep(0, 'question')}>Start diagnostic</button>
            </div>
          )}

          {question && (
            <div className="mt-6">
              <p id="project-fit-progress-label" className="text-sm text-gray-400" aria-live="polite">Question {step + 1} of {QUESTIONS.length}</p>
              <progress className="mt-2 h-2 w-full overflow-hidden rounded-full accent-[#9b7bff]" value={step + 1} max={QUESTIONS.length} aria-labelledby="project-fit-progress-label" aria-valuetext={`Question ${step + 1} of ${QUESTIONS.length}`}>Question {step + 1} of {QUESTIONS.length}</progress>
              <fieldset className="mt-7">
                <legend ref={questionHeadingRef} tabIndex="-1" className="scroll-mt-28 text-xl font-bold leading-snug text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple">{question.legend}</legend>
                {question.hint && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">{question.hint}</p>}
                <div className="mt-5 grid gap-3">
                  {question.options.map(([value, label]) => {
                    const inputId = `${question.id}-${value}`;
                    return (
                      <label key={value} htmlFor={inputId} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-white/15 bg-[#0C0D0D] p-4 text-gray-200 hover:border-accent-purple/70 focus-within:ring-2 focus-within:ring-accent-purple">
                        <input id={inputId} name={question.id} type="radio" value={value} checked={answers[question.id] === value} onChange={() => selectAnswer(value)} className="mt-1 h-5 w-5 shrink-0 accent-[#9b7bff]" />
                        <span className="leading-relaxed">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="mt-7 flex flex-wrap gap-3">
                {step > 0 && <button type="button" className={`border border-white/30 text-white hover:bg-white/10 ${buttonClass}`} onClick={() => goToStep(step - 1, 'question')}>Previous</button>}
                <button type="button" className={`bg-accent-purple text-white hover:bg-accent-purple/90 disabled:cursor-not-allowed disabled:opacity-50 ${buttonClass}`} disabled={!answers[question.id]} onClick={() => goToStep(step + 1, step === QUESTIONS.length - 1 ? 'result' : 'question')}>{step === QUESTIONS.length - 1 ? 'See result' : 'Next'}</button>
                <button type="button" className={`text-[#d8caff] hover:text-white ${buttonClass}`} onClick={restart}>Restart</button>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-7" aria-live="polite">
              <p className="text-sm text-gray-400">Result</p>
              <h3 ref={resultHeadingRef} tabIndex="-1" className="scroll-mt-28 mt-2 text-3xl font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple">{result.decision}</h3>
              <ResultList heading="Why this result" items={result.reasons} />
              <ResultList heading="Limits and risks to review" items={result.risks} />
              {result.proof.length > 0 && (
                <div className="mt-7">
                  <h4 className="text-lg font-bold text-white">Relevant published proof</h4>
                  <ul className="mt-3 space-y-2">
                    {result.proof.map((reference) => <li key={reference.id}><Link to={`/project/${reference.slug}/`} className="text-[#d8caff] underline decoration-accent-purple underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple">{proofLabel(reference)}</Link></li>)}
                  </ul>
                </div>
              )}
              <ResultList heading="Next step" items={result.nextSteps} />
              {result.alternative && <p className="mt-7 rounded-lg border border-white/15 bg-[#0C0D0D] p-4 text-gray-300"><span className="font-bold text-white">A safer alternative: </span>{result.alternative}</p>}
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" className={`border border-white/30 text-white hover:bg-white/10 ${buttonClass}`} onClick={() => goToStep(QUESTIONS.length - 1, 'question')}>Back to last question</button>
                <button type="button" className={`border border-white/30 text-white hover:bg-white/10 ${buttonClass}`} onClick={restart}>Restart</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const ResultList = ({ heading, items }) => (
  <div className="mt-7">
    <h4 className="text-lg font-bold text-white">{heading}</h4>
    <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-300">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  </div>
);

export default ProjectFitDiagnostic;
