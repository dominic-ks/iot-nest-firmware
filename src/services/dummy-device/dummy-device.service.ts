import { Injectable } from '@nestjs/common';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { UtilityService } from '../utility/utility.service';

import { VirtualDevice } from 'src/interfaces/virtual-device.interface';
import { Device } from 'src/classes/device/device';

@Injectable()
export class DummyDeviceService implements VirtualDevice {

  private appMessagesService: AppMessagesService;

  public deviceInfo: Device;

  constructor(
    private utilityService: UtilityService,
  ) {
    this.appMessagesService = this.utilityService.appMessagesService;
  }

  executeDeviceCommand(commandData: any): void {
    // For dummy device, just update the data
    this.setDeviceData(commandData);
  }

  getDeviceTypeName(): string {
    return 'Dummy Device';
  }

  setDevice(device: Device): void {
    this.updateDeviceData(device);
  }

  setDeviceData(data: any): void {
    this.deviceInfo.data = { ...this.deviceInfo.data, ...data };
    this.reportToMqtt();
  }

  updateDeviceData(device: Device): void {
    this.deviceInfo = device;
    this.deviceInfo.data = typeof(this.deviceInfo.data) !== 'undefined' ? this.deviceInfo.data : {};
  }

  private reportToMqtt(): void {
    // Broadcast the updated data for MQTT publishing
    this.appMessagesService.broadcastMessage({
      data: this.deviceInfo,
      type: 'mqtt-send',
    });
  }

}
