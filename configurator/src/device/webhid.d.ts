/**
 * Minimal WebHID ambient declarations.
 *
 * The WebHID API is not part of the TypeScript DOM lib bundled with this
 * project, so we declare just the surface `WebHidDeviceService` uses. If the
 * DOM lib ever ships WebHID types, these interface-merge cleanly.
 */

interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

interface HIDDeviceRequestOptions {
  filters: HIDDeviceFilter[];
}

interface HIDCollectionInfo {
  usagePage: number;
  usage: number;
}

interface HIDInputReportEvent extends Event {
  device: HIDDevice;
  reportId: number;
  data: DataView;
}

interface HIDDeviceEventMap {
  inputreport: HIDInputReportEvent;
}

interface HIDDevice extends EventTarget {
  readonly opened: boolean;
  readonly vendorId: number;
  readonly productId: number;
  readonly productName: string;
  readonly collections: HIDCollectionInfo[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: ArrayBufferView | ArrayBuffer): Promise<void>;
  addEventListener<K extends keyof HIDDeviceEventMap>(
    type: K,
    listener: (ev: HIDDeviceEventMap[K]) => void,
  ): void;
  removeEventListener<K extends keyof HIDDeviceEventMap>(
    type: K,
    listener: (ev: HIDDeviceEventMap[K]) => void,
  ): void;
}

interface HIDConnectionEvent extends Event {
  device: HIDDevice;
}

interface HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>;
  requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>;
  onconnect: ((this: HID, ev: HIDConnectionEvent) => void) | null;
  ondisconnect: ((this: HID, ev: HIDConnectionEvent) => void) | null;
}

interface Navigator {
  readonly hid: HID;
}
