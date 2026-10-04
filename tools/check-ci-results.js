const requiredJobs = [
  'unit-tests', 'production-build', 'passive-qa',
  'contact-qa', 'motion-qa', 'telemetry-qa', 'apache-service-qa',
];

try {
  const results = JSON.parse(process.env.CI_JOB_RESULTS ?? 'null');
  if (!results || typeof results !== 'object' || Array.isArray(results)) {
    throw new Error('CI_JOB_RESULTS must contain the required job results.');
  }
  const jobs = new Set([...requiredJobs, ...Object.keys(results)]);
  const unsuccessful = [...jobs].filter((job) => results[job]?.result !== 'success');
  if (unsuccessful.length) {
    throw new Error(`Required CI jobs did not succeed: ${unsuccessful.join(', ')}`);
  }
  console.log('All required CI jobs succeeded.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
