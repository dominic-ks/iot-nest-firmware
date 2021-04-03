import { MqttConnectionOptions } from './mqtt-connection-options';

describe('MqttConnectionOptions', () => {
  it('should be defined', () => {
    expect(new MqttConnectionOptions()).toBeDefined();
  });
});
