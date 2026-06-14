const CleanerModel = require('./cleaner.model');

const CleanerService = {
  getCleanerJobs: async (user) => {
    // 1. Find employee ID matching the current logged-in user
    const employeeId = await CleanerModel.getEmployeeIdByPersonId(user.personId);
    if (!employeeId) {
      const err = new Error('No employee record linked to this user account.');
      err.statusCode = 403;
      throw err;
    }

    // 2. Fetch past, today's, and upcoming occurrences
    const past = await CleanerModel.findPastJobs(employeeId);
    const todayRaw = await CleanerModel.findTodayJobs(employeeId);
    const upcoming = await CleanerModel.findUpcomingJobs(employeeId);

    // 3. For each today's and upcoming job, query partner cleaners assigned to the same schedule rule
    const today = await Promise.all(
      todayRaw.map(async (job) => {
        const partners = await CleanerModel.findAssignedCleaners(job.ServiceID, employeeId);
        return {
          ...job,
          partners: partners.map(p => `${p.FirstName} ${p.SureName}`)
        };
      })
    );

    const upcomingWithPartners = await Promise.all(
      upcoming.map(async (job) => {
        const partners = await CleanerModel.findAssignedCleaners(job.ServiceID, employeeId);
        return {
          ...job,
          partners: partners.map(p => `${p.FirstName} ${p.SureName}`)
        };
      })
    );

    return {
      past,
      today,
      upcoming: upcomingWithPartners
    };
  }
};

module.exports = CleanerService;
