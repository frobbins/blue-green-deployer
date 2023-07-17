import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'deployment-solution',
  frameworkVersion: '2',
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    lambdaHashingVersion: '20201221',
  },
  functions: {
    executeSmokeTests: {
      handler: 'src/handlers/executeSmokeTests.handler',
      events: [{ s3: { bucket: '${self:service}-${opt:stage}', event: 's3:ObjectCreated:*' } }],
      environment: {
        STAGE: '${opt:stage}',
      },
    },
    migrateTraffic: {
      handler: 'src/handlers/migrateTraffic.handler',
    },
    rollbackOnFailure: {
      handler: 'src/handlers/rollbackOnFailure.handler',
    },
    notifySuccess: {
      handler: 'src/handlers/notifySuccess.handler',
    },
    startDeployment: {
      handler: 'src/handlers/startDeployment.handler',
    },
  },
  resources: {
    Resources: {
      DeployBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:service}-${opt:stage}',
          NotificationConfiguration: {
            LambdaConfigurations: [
              {
                Event: 's3:ObjectCreated:*',
                Function: { 'Fn::GetAtt': ['startDeployment', 'Arn'] },
              },
            ],
          },
        },
      },
      StartDeploymentPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          Action: 'lambda:InvokeFunction',
          FunctionName: { 'Fn::GetAtt': ['startDeployment', 'Arn'] },
          Principal: 's3.amazonaws.com',
          SourceAccount: { Ref: 'AWS::AccountId' },
          SourceArn: 'arn:aws:s3:::${DeployBucket}',
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
