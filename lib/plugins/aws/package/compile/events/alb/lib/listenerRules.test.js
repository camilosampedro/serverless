'use strict';

const expect = require('chai').expect;
const AwsCompileAlbEvents = require('../index');
const Serverless = require('../../../../../../../Serverless');
const AwsProvider = require('../../../../../provider/awsProvider');

describe('#compileListenerRules()', () => {
  let awsCompileAlbEvents;

  beforeEach(() => {
    const serverless = new Serverless();
    serverless.setProvider('aws', new AwsProvider(serverless));
    serverless.service.service = 'some-service';
    serverless.service.provider.compiledCloudFormationTemplate = { Resources: {} };

    awsCompileAlbEvents = new AwsCompileAlbEvents(serverless);
  });

  it('should create ELB listener rule resources', () => {
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

    return awsCompileAlbEvents.compileListenerRules().then(() => {
      const resources = awsCompileAlbEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources;

      expect(resources.FirstAlbListenerRule1).to.deep.equal({
        Type: 'AWS::ElasticLoadBalancingV2::ListenerRule',
        Properties: {
          Actions: [
            {
              TargetGroupArn: {
                Ref: 'FirstAlbTargetGroup',
              },
              Type: 'forward',
            },
          ],
          Conditions: [
            {
              Field: 'path-pattern',
              Values: [
                '/hello',
              ],
            },
            {
              Field: 'host-header',
              Values: [
                'example.com',
              ],
            },
          ],
          // eslint-disable-next-line max-len
          ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/my-load-balancer/50dc6c495c0c9188/f2f7dc8efc522ab2',
          Priority: 1,
        },
      });
      expect(resources.SecondAlbListenerRule2).to.deep.equal({
        Type: 'AWS::ElasticLoadBalancingV2::ListenerRule',
        Properties: {
          Actions: [
            {
              TargetGroupArn: {
                Ref: 'SecondAlbTargetGroup',
              },
              Type: 'forward',
            },
          ],
          Conditions: [
            {
              Field: 'path-pattern',
              Values: [
                '/world',
              ],
            },
          ],
          // eslint-disable-next-line max-len
          ListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/my-load-balancer/50dc6c495c0c9188/f2f7dc8efc522ab2',
          Priority: 2,
        },
      });
    });
  });
});
