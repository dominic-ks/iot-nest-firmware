import { Device } from '../classes/device/device';

export interface VirtualDevice {
  deviceInfo: Device;
  getDeviceTypeName: () => string;
  getTelemtryData: () => Object;
  setDevice: ( device: Device ) => void;
}
