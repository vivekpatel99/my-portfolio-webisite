export const HOURLY_RATE_EUR = 45;
export const HOURLY_RATE_LABEL = `€${HOURLY_RATE_EUR}/hour`;
export const HOURLY_FROM_LABEL = `from ${HOURLY_RATE_LABEL}`;

export const localizedHourlyRate = (locale) => locale === 'de' ? `${HOURLY_RATE_EUR} €/Stunde` : HOURLY_RATE_LABEL;
export const localizedHourlyFrom = (locale) => locale === 'de' ? `ab ${localizedHourlyRate(locale)}` : HOURLY_FROM_LABEL;
