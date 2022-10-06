export const DefaultJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 5 * 60 * 1000,
  },
  removeOnComplete: {
    age: 24 * 60 * 60, // remove job after 24 hours to prevent duplications
  },
  removeOnFail: {
    age: 30 * 24 * 60 * 60, // remove job after 30 days
  },
};
