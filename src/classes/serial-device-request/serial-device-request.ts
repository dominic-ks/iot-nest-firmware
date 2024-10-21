export class SerialDeviceRequest {
  command: string;
  requestMeta: {
    requestID: string;
    requestService: string;
  };
}
