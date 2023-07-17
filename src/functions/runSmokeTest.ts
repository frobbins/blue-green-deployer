import axios from 'axios';
import {getActiveStage_task} from "./getActiveStage_task";

export async function runSmokeTest() {
    try {
        const activeStage = await getActiveStage_task();

        // Determine the appropriate health check URL based on the active stage
        const healthCheckUrl = activeStage === 'blue'
            ? 'https://blue.example.com/health'
            : 'https://green.example.com/health';

        // Call the health check URL
        const response = await axios.get(healthCheckUrl);

        // Validate the response as per your smoke test requirements
        if (response.status === 200) {
            console.log('Smoke test passed');
        } else {
            console.log('Smoke test failed');
        }
    } catch (error) {
        console.error('Error occurred during smoke test:', error);
    }
}