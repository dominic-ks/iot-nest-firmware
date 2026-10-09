import { Zigbee2mqttService } from './zigbee2mqtt.service';

describe('Zigbee2mqttService device message dispatch', () => {
  let service: any;
  let client: { subscribe: jest.Mock, unsubscribe: jest.Mock };

  const device = { id: '0x001e5e090249a792' } as any;

  beforeEach(() => {
    service = new Zigbee2mqttService({ appMessagesService: {}, set: () => {} } as any);
    client = { subscribe: jest.fn(), unsubscribe: jest.fn() };
    service.mqttClient = client;
    service.attachedDevices = [{ ieee_address: device.id, friendly_name: device.id }];
  });

  it('delivers messages only for the subscribed topic', () => {
    const callback = jest.fn();
    service.mqttSubscribe(device, callback);

    service.onMessage('zigbee2mqtt/' + device.id, '{}');
    service.onMessage('zigbee2mqtt/0x3425b4fffe149e16', '{}');

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('replaces the callback on re-subscribe instead of stacking listeners', () => {
    const first = jest.fn();
    const second = jest.fn();
    service.mqttSubscribe(device, first);
    service.mqttSubscribe(device, second);

    service.onMessage('zigbee2mqtt/' + device.id, '{}');

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('follows a renamed device without matching on the device ID', () => {
    const callback = jest.fn();
    service.mqttSubscribe(device, callback);

    service.attachedDevices = [{ ieee_address: device.id, friendly_name: 'boiler' }];
    service.mqttSubscribe(device, callback);

    expect(client.unsubscribe).toHaveBeenCalledWith('zigbee2mqtt/' + device.id);
    service.onMessage('zigbee2mqtt/boiler', '{}');
    service.onMessage('zigbee2mqtt/' + device.id, '{}');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('keeps dispatching when one handler throws', () => {
    const other = { id: '0x3425b4fffe149e16' } as any;
    service.attachedDevices.push({ ieee_address: other.id, friendly_name: other.id });
    service.mqttSubscribe(device, () => { throw new Error('bad payload'); });
    const otherCallback = jest.fn();
    service.mqttSubscribe(other, otherCallback);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => service.onMessage('zigbee2mqtt/' + device.id, '{}')).not.toThrow();
    service.onMessage('zigbee2mqtt/' + other.id, '{}');
    expect(otherCallback).toHaveBeenCalledTimes(1);
  });
});
