import { Device } from '../classes/device/device';

export interface VirtualDevice {
  deviceInfo: Device;
  getDeviceTypeName: () => string;
  setDevice: ( device: Device ) => void;
}
