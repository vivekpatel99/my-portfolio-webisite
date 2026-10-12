import { HOURLY_RATE_LABEL } from '../src/config/pricing.js';

export const replacePricingTokens = (html) => html.replaceAll('__HOURLY_RATE_LABEL__', HOURLY_RATE_LABEL);

export default function pricingHtmlPlugin() {
  return {
    name: 'pricing-html',
    transformIndexHtml: { order: 'pre', handler: replacePricingTokens },
  };
}
