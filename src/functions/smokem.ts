import { Lambda } from 'aws-sdk';
import { Handler, Context } from 'aws-lambda';

export const handler: Handler = async (event: any, context: Context) => {
  console.log('Event: ', event);

  const lambda = new Lambda();

  let failedTests = [];

  // Iterate over each Lambda function received in the event input
  for(let lambdaArn of event.lambdas) {
    const lambdaNameVersion = lambdaArn.split(':').slice(-2).join(':');  // Extract the name and version

    const params = {
      FunctionName: lambdaNameVersion,  // Specify the version to be tested
      InvocationType: 'RequestResponse',
    };

    try {
      // Invoke the Lambda function
      const response = await lambda.invoke(params).promise();
      console.log(`Response from ${lambdaNameVersion}:`, response);

      // Check the response
      if(response.StatusCode !== 200) {
        failedTests.push(lambdaNameVersion);
      }
    } catch(error) {
      console.error(`Error invoking ${lambdaNameVersion}:`, error);
      failedTests.push(lambdaNameVersion);
    }
  }

  if(failedTests.length > 0) {
    throw new Error(`Smoke tests failed for the following Lambdas: ${failedTests.join(', ')}`);
  }

  console.log('All smoke tests passed successfully!');
  return { status: 'All smoke tests passed successfully!' };
};
