class SerialDeviceDataPoint {
  slug: string;
  name: string;
  value: number;
}

export class SerialDeviceResponse {
  requestMeta: {
    requestService: string;
    requestID: string;
  };  
  status: string;  
  data: SerialDeviceDataPoint[];  
  receivedCommand: string;
}
