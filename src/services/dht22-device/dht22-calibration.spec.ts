import { applyLinearCalibration } from './dht22-device.service';

describe('applyLinearCalibration', () => {
  it('leaves values unchanged with identity calibration', () => {
    expect(applyLinearCalibration(64.1, 1, 0, 0, 100)).toBe(64.1);
  });

  it('applies slope and intercept, rounded to one decimal', () => {
    // device-003 DHT22 vs SNZB-02D fit: 0.483 * 79.6 + 26.36 = 64.8068
    expect(applyLinearCalibration(79.6, 0.483, 26.36, 0, 100)).toBe(64.8);
  });

  it('clamps to the allowed range', () => {
    expect(applyLinearCalibration(150, 1, 0, 0, 100)).toBe(100);
    expect(applyLinearCalibration(-5, 1, 0, 0, 100)).toBe(0);
  });

  it('supports a plain offset', () => {
    expect(applyLinearCalibration(22.5, 1, -0.3, -40, 80)).toBe(22.2);
  });
});
