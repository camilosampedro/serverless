'use strict';

const expect = require('chai').expect;
const AwsCompileAlbEvents = require('../index');
const Serverless = require('../../../../../../../Serverless');
const AwsProvider = require('../../../../../provider/awsProvider');

describe('#compilePermissions()', () => {
  let awsCompileAlbEvents;

  beforeEach(() => {
    const serverless = new Serverless();
    serverless.setProvider('aws', new AwsProvider(serverless));
    serverless.service.service = 'some-service';
    serverless.service.provider.compiledCloudFormationTemplate = { Resources: {} };

    awsCompileAlbEvents = new AwsCompileAlbEvents(serverless);
  });

  it('should create Lambda permission resources', () => {
    awsCompileAlbEvents.validated = {
      events: [
        {
          functionName: 'first',
          // eslint-disable-next-line max-len
          listenerArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/my-load-balancer/50dc6c495c0c9188/f2f7dc8efc522ab2',
          priority: 1,
          conditions: {
            host: 'example.com',
            path: '/hello',
          },
        },
        {
          functionName: 'second',
          // eslint-disable-next-line max-len
          listenerArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/my-load-balancer/50dc6c495c0c9188/f2f7dc8efc522ab2',
          priority: 2,
          conditions: {
            path: '/world',
          },
        },
      ],
    };

    return awsCompileAlbEvents.compilePermissions().then(() => {
      const resources = awsCompileAlbEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources;

      expect(resources.FirstLambdaPermissionAlb).to.deep.equal({
        Type: 'AWS::Lambda::Permission',
        Properties: {
          Action: 'lambda:InvokeFunction',
          FunctionName: {
            'Fn::GetAtt': [
              'FirstLambdaFunction',
              'Arn',
            ],
          },
          Principal: 'elasticloadbalancing.amazonaws.com',
        },
        DependsOn: ['FirstLambdaFunction'],
      });
      expect(resources.SecondLambdaPermissionAlb).to.deep.equal({
        Type: 'AWS::Lambda::Permission',
        Properties: {
          Action: 'lambda:InvokeFunction',
          FunctionName: {
            'Fn::GetAtt': [
              'SecondLambdaFunction',
              'Arn',
            ],
          },
          Principal: 'elasticloadbalancing.amazonaws.com',
        },
        DependsOn: ['SecondLambdaFunction'],
      });
    });
  });
});
