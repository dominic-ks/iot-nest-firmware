import { Device } from '../classes/device/device';

export interface VirtualDevice {
  deviceInfo: Device;
  executeDeviceCommand: ( commandData: any ) => void;
  getDeviceTypeName: () => string;
  setDevice: ( device: Device ) => void;
  setDeviceData: ( data: any ) => void;
  updateDeviceData: ( data: any ) => void;
}
