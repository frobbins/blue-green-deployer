export const stateMachineDefinition = {
    Comment: "A state machine that moves live traffic incrementally using a weighted alias",
    StartAt: "SmokeTest",
    States: {
        SmokeTest: {
            Type: "Task",
            Resource: "arn:aws:lambda:us-east-1:826279638068:function:cicd-lambda-workflow-task-smoke-test",
            InputPath: "$",
            ResultPath: "$",
            Next: "VerifyHealthCheckForSmokeTest"
        },
        VerifyHealthCheckForSmokeTest: {
            Type: "Choice",
            Choices: [
                {
                    Variable: "$.smoketeststatus",
                    StringEquals: "FAILED",
                    Next: "Fail"
                },
                {
                    Variable: "$.smoketeststatus",
                    StringEquals: "SUCCEEDED",
                    Next: "PredeploymentCheck"
                },
                {
                    Variable: "$.smoketeststatus",
                    StringEquals: "SKIPPED",
                    Next: "PredeploymentCheck"
                }
            ],
            Default: "Fail"
        },
        PredeploymentCheck: {
            Type: "Choice",
            Choices: [
                {
                    Variable: "$.smoketeststatus",
                    StringEquals: "FAILED",
                    Next: "Fail"
                },
                {
                    Variable: "$.smoketeststatus",
                    StringEquals: "SUCCEEDED",
                    Next: "SendApprovalRequest"
                },
                {
                    Variable: "$.smoketeststatus",
                    StringEquals: "SKIPPED",
                    Next: "SendApprovalRequest"
                }
            ],
            Default: "Fail"
        },
        SendApprovalRequest: {
            Type: "Task",
            Resource: "arn:aws:states:::lambda:invoke.waitForTaskToken",
            Parameters: {
                FunctionName: "cicd-lambda-workflow-task-ask-the-boss",
                Payload: {
                    "step.$": "$$.State.Name",
                    "token.$": "$$.Task.Token"
                }
            },
            ResultPath: "$.output",
            Next: "CreateSnowTicket",
            Catch: [
                {
                    ErrorEquals: [
                        "rejected"
                    ],
                    ResultPath: "$.output",
                    Next: "ManagerDenied"
                }
            ]
        },
        CreateSnowTicket: {
            Type: "Task",
            Resource: "arn:aws:lambda:us-east-1:826279638068:function:cicd-lambda-workflow-task-snow-ticket-creation",
            InputPath: "$",
            ResultPath: "$",
            Next: "UpdateWeightAll",
            Catch: [
                {
                    ErrorEquals: [
                        "rejected"
                    ],
                    ResultPath: "$.output",
                    Next: "Fail"
                }
            ]
        },
        UpdateWeightAll: {
            Type: "Map",
            ItemsPath: "$.functions",
            MaxConcurrency: 3,
            Iterator: {
                StartAt: "CalculateWeights",
                States: {
                    CalculateWeights: {
                        Type: "Task",
                        Resource: "arn:aws:lambda:us-east-1:826279638068:function:cicd-lambda-workflow-task-calculate_weight",
                        ResultPath: "$.weights",
                        Next: "UpdateWeight"
                    },
                    UpdateWeight: {
                        Type: "Task",
                        Resource: "arn:aws:lambda:us-east-1:826279638068:function:cicd-lambda-workflow-update-weight",
                        InputPath: "$",
                        ResultPath: "$.current-weight",
                        Next: "Wait"
                    },
                    Wait: {
                        Type: "Wait",
                        SecondsPath: "$.interval",
                        Next: "HealthCheck"
                    },
                    HealthCheck: {
                        Type: "Task",
                        Resource: "arn:aws:lambda:us-east-1:826279638068:function:cicd-lambda-workflow-task-health-check",
                        InputPath: "$",
                        ResultPath: "$.status",
                        End: true
                    }
                }
            },
            InputPath: "$",
            ResultPath: "$.functions",
            Next: "ParseInput"
        },
        ParseInput: {
            Type: "Task",
            Resource: "arn:aws:lambda:us-east-1:826279638068:function:cicd-lambda-workflow-task-parse-input",
            InputPath: "$",
            ResultPath: "$",
            Next: "VerifyHealthCheck"
        },
        VerifyHealthCheck: {
            Type: "Choice",
            InputPath: "$",
            Choices: [
                {
                    Variable: "$.status",
                    StringEquals: "",
                    Next: "Rollback"
                },
                {
                    Variable: "$.status",
                    StringEquals: "SUCCEEDED",
                    Next: "IsFullyWeighted"
                }
            ],
            Default: "Rollback"
        },
        IsFullyWeighted: {
            Type: "Choice",
            Choices: [
                {
                    Variable: "$.current-weight",
                    NumericEquals: 1,
                    Next: "Finalize"
                }
            ],
            Default: "UpdateWeightAll"
        },
        Rollback: {
            Type: "Task",
            Resource: "arn:aws:lambda:us-east-1:826279638068:function:cicd-lambda-workflow-task-roll-back",
            Next: "Fail",
            InputPath: "$",
            ResultPath: "$"
        },
        Fail: {
            Type: "Fail",
            Cause: "Function deployment failed",
            Error: "HealthCheck returned FAILED"
        },
        ManagerDenied: {
            Type: "Task",
            Resource: "arn:aws:lambda:us-east-1:826279638068:function:cicd-lambda-workflow-task-manager-denied",
            InputPath: "$",
            End: true
        },
        Finalize: {
            Type: "Task",
            Resource: "arn:aws:lambda:us-east-1:826279638068:function:cicd-lambda-workflow-task-finalize",
            InputPath: "$",
            ResultPath: "$",
            Next: "CloseSnowTicket"
        },
        CloseSnowTicket: {
            Type: "Task",
            Resource: "arn:aws:lambda:us-east-1:826279638068:function:cicd-lambda-workflow-task-snow-ticket-closing",
            InputPath: "$",
            End: true
        }
    }
};
