import React from 'react';
import { Description, Field, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { BUDGET_LABELS, BUDGET_OPTIONS } from '@/lib/budgetOptions';
import { SENSITIVE_TELEMETRY_REGION_PROPS } from '@/lib/sensitiveTelemetry';

const EMPTY_LABEL = 'Select your budget range';
const STALE_LABEL = 'Choose a listed range or leave blank';

export default function BudgetSelect({ value, onChange, disabled, error }) {
  const stale = Boolean(value && !BUDGET_OPTIONS.includes(value));
  const label = stale ? STALE_LABEL : BUDGET_LABELS[value] ?? EMPTY_LABEL;

  return (
    <Field className="contact-detection-field mb-5" disabled={disabled}>
      <Listbox
        as="div"
        name="budget"
        value={value}
        onChange={(nextValue) => {
          if (nextValue === '' || BUDGET_OPTIONS.includes(nextValue)) onChange(nextValue);
        }}
        disabled={disabled}
        invalid={Boolean(error)}
        className="contact-detection-frame"
        data-filled={Boolean(value)}
      >
        <label htmlFor="budget" className="contact-detection-label">Budget Range</label>
        <ListboxButton
          id="budget"
          value={value}
          className="contact-detection-control contact-detection-select"
          aria-label={`Budget Range ${label}`}
          aria-invalid={Boolean(error)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            // The primitive's default Enter handler submits the surrounding form.
            event.preventDefault();
            if (!event.repeat) event.currentTarget.click();
          }}
        >
          <span className="sr-only">Budget Range </span>
          <span>{label}</span>
          <ChevronDown size={16} aria-hidden="true" className="contact-budget-chevron" />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom start"
          portal
          modal={false}
          className="contact-budget-options"
          {...SENSITIVE_TELEMETRY_REGION_PROPS}
        >
          {stale ? (
            <ListboxOption value={value} disabled aria-label={STALE_LABEL} className="contact-budget-option">
              <span>{STALE_LABEL}</span>
              <span className="contact-budget-check" aria-hidden="true"><Check size={18} /></span>
            </ListboxOption>
          ) : null}
          {['', ...BUDGET_OPTIONS].map((option) => (
            <ListboxOption key={option} value={option} aria-label={BUDGET_LABELS[option] ?? EMPTY_LABEL} className="contact-budget-option">
              {({ selected }) => (
                <>
                  <span>{BUDGET_LABELS[option] ?? EMPTY_LABEL}</span>
                  <span className="contact-budget-check" aria-hidden="true">
                    {selected ? <Check size={18} /> : null}
                  </span>
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
      {error ? <Description as="p" id="budget-error" role="alert" className="mt-2 text-sm text-red-400">{error}</Description> : null}
    </Field>
  );
}
