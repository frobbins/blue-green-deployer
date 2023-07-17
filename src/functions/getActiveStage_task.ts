// stageUtils.ts

// Function to retrieve the active stage
export function getActiveStage_task(): string {
    // Implement the logic to determine the active stage dynamically
    // This could involve checking routing rules, querying deployment configurations, or using environment variables

    // Example: Assume you have an environment variable named "ACTIVE_STAGE" set to either "blue" or "green"
    const activeStage: string | undefined = process.env.ACTIVE_STAGE;

    // Validate and return the active stage
    if (activeStage === 'blue' || activeStage === 'green') {
        return activeStage;
    } else {
        throw new Error('Invalid or missing active stage');
    }
}