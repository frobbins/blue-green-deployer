import { Lambda, CloudWatchLogs } from 'aws-sdk';
import { Handler, Context } from 'aws-lambda';

const lambda = new Lambda();
const logs = new CloudWatchLogs();

export const handler: Handler = async (event: any, context: Context) => {
  console.log('Event: ', event);

  const { lambdas, trafficShiftSettings, cloudWatchSettings } = event;
  const { startPercent, endPercent, incrementPercent, incrementIntervalSeconds } = trafficShiftSettings;
  const { logGroup, logStream } = cloudWatchSettings;

  let weight = startPercent;
  
  while(weight <= endPercent) {
    for(let lambdaArn of lambdas) {
      const lambdaNameVersion = lambdaArn.split(':').slice(-2).join(':');  // Extract the name and version

      try {
        // Update the function's alias to shift traffic to the new version
        await lambda.updateAlias({
          FunctionName: lambdaNameVersion.split(':')[0],  // Lambda function name
          Name: 'live',  // Alias name
          RoutingConfig: {  // Routing configuration
            AdditionalVersionWeights: {
              [lambdaNameVersion.split(':')[1]]: weight/100  // New function version and its weight
            }
          }
        }).promise();

        console.log(`Shifted ${weight}% of traffic to version ${lambdaNameVersion.split(':')[1]} of ${lambdaNameVersion.split(':')[0]}`);

      } catch(error) {
        console.error(`Error updating alias for ${lambdaNameVersion}:`, error);
        throw error;
      }
    }

    // Wait for the specified interval
    await new Promise(resolve => setTimeout(resolve, incrementIntervalSeconds * 1000));

    // Check CloudWatch logs for new errors
    const logEvents = await logs.getLogEvents({
      logGroupName: logGroup,
      logStreamName: logStream,
      startFromHead: true
    }).promise();

    const newErrors = logEvents.events.filter(event => event.message.includes('ERROR'));
    if(newErrors.length > 0) {
      console.error('New errors detected in CloudWatch logs:', newErrors);
      throw new Error('New errors detected during traffic shift');
    }

    // Increase the weight for the next iteration
    weight += incrementPercent;
  }

  console.log('Successfully completed traffic shift!');
  return { status: 'Successfully completed traffic shift!' };
};
