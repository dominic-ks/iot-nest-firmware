import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { UtilityService } from '../utility/utility.service';

import { Device } from '../../classes/device/device';

import { VirtualDevice } from '../../interfaces/virtual-device.interface';

class Dht22Device extends Device {
  data: {
    temp?: number;
    hum?: number;
  }
  id: string;
  parent: string;
  type: string;
}

@Injectable()
export class Dht22DeviceService implements VirtualDevice {

  private appMessagesService: AppMessagesService;
  private configService: any;
  public deviceInfo: Dht22Device;
  private intervalId: NodeJS.Timeout | null = null;
  private filePath: string;

  constructor(
    private utilityService: UtilityService,
  ) {
    this.appMessagesService = this.utilityService.appMessagesService;
    this.configService = this.utilityService.configService;
    this.filePath = path.join(process.cwd(), 'dht22_readings.json');
  }

  executeDeviceCommand(commandData: any): void {
    // Implement if needed
  }

  getDeviceTypeName(): string {
    return 'DHT22 Sensor';
  }

  private readSensorData(): void {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      const reading = JSON.parse(data);
      console.log('Reading:', reading);
      if (reading && typeof reading === 'object' && 'temp' in reading && 'hum' in reading && typeof reading.temp === 'number' && typeof reading.hum === 'number') {
        this.setDeviceData({
          temp: reading.temp,
          hum: reading.hum,
        });
      } else {
        console.warn('Invalid reading data:', reading);
      }
    } catch (error) {
      console.warn('Error reading DHT22 readings file:', error);
    }
  }

  setDevice(device: Dht22Device): void {
    this.updateDeviceData(device);

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.readSensorData();
    this.intervalId = setInterval(() => {
      this.readSensorData();
    }, this.deviceInfo.interval || 10000); // Default 10 seconds if not set
  }

  sendData() {
    this.appMessagesService.broadcastMessage({
      data: this.deviceInfo,
      type: 'mqtt-send',
    });
  }

  setDeviceData(data: any): void {
    let dataChanged = false;

    for (let deviceProperty in data) {
      let devicePropertyValue = data[deviceProperty];

      if (typeof(this.deviceInfo.data[deviceProperty]) !== 'undefined' && this.deviceInfo.data[deviceProperty] === devicePropertyValue) {
        continue;
      }

      dataChanged = true;
      this.deviceInfo.data[deviceProperty] = devicePropertyValue;
    }

    if (!dataChanged) {
      return;
    }

    this.sendData();
  }

  updateDeviceData(device: Dht22Device): void {
    this.deviceInfo = device;
    this.deviceInfo.data = device.data || {};
  }

}