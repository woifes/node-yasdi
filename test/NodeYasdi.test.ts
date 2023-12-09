// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import { tmpdir } from "os";
import { join } from "path";
import { NodeYasdi } from "../src/NodeYasdi";
import { searchDevicesAsync, yasdiInit } from "../src/bindings/yasdiBindings";
import { Inverter } from "../src/inverter/Inverter";
import { tNodeYasdiConfig } from "../src/runtypes/NodeYasdiConfig";
import { createYasdiIniFile } from "../src/util/createYasdiIniFile";
jest.mock("../src/bindings/yasdiBindings");
jest.mock("../src/util/createYasdiIniFile");
jest.mock("../src/inverter/Inverter");

jest.useFakeTimers();
const NOW = new Date(2000, 1, 29, 12, 0);
jest.setSystemTime(NOW);

const TEST_ID = "test01";
const TEST_INI_DIR = join("path", "to", "tmp");
const FULL_INI_PATH = join(TEST_INI_DIR, `${TEST_ID}.ini`);
const CONFIG: tNodeYasdiConfig = {
    expectedDeviceCount: 3,
    iniFileDir: TEST_INI_DIR,
    serialPorts: ["/dev/ttyUSB0"],
};

const createYasdiIniFileMock = (
    createYasdiIniFile as unknown as jest.Mock
).mockImplementation((_dir: string, _fileName: string, _comPorts: any) => {
    return FULL_INI_PATH;
});
const YasdiInitMock = (yasdiInit as unknown as jest.Mock).mockImplementation(
    () => {
        return Promise.resolve();
    },
);
const SearchDevicesAsyncMock = searchDevicesAsync as unknown as jest.Mock;
const InverterMock = (Inverter as unknown as jest.Mock).mockImplementation(
    (handle: number, nodeYasdi: NodeYasdi) => {
        return {
            _handle: handle,
            serial: handle * 2,
            onDownloadChannels: jest.fn(),
        };
    },
);

afterEach(() => {
    jest.clearAllMocks();
});

describe("creation tests", () => {
    it("should create without issues", (done) => {
        const initDoneCb = jest.fn();
        const ny = new NodeYasdi(TEST_ID, CONFIG);
        ny.on("initDone", initDoneCb);

        ny.on("initDone", () => {
            expect(createYasdiIniFileMock).toBeCalledTimes(1);
            const [dir, fileName, serialPorts] =
                createYasdiIniFileMock.mock.calls[0];
            expect(dir).toBe(TEST_INI_DIR);
            expect(fileName).toBe(`${TEST_ID}.ini`);
            expect(serialPorts).toEqual(["/dev/ttyUSB0"]);

            expect(YasdiInitMock).toBeCalledTimes(1);
            const [iniPath, deviceDetectCb, newValCb] =
                YasdiInitMock.mock.calls[0];
            expect(iniPath).toBe(FULL_INI_PATH);
            expect(typeof deviceDetectCb).toBe("function");
            expect(typeof newValCb).toBe("function");

            expect(SearchDevicesAsyncMock).toBeCalledTimes(1);
            expect(SearchDevicesAsyncMock.mock.calls[0][0]).toBe(3);

            expect(initDoneCb).toBeCalledTimes(1);

            expect(ny.deviceSearchFinished).toBe(false);
            expect(ny.deviceCount).toBe(0);
            expect(ny.handles).toEqual([]);
            expect(ny.serials).toEqual([]);

            done();
        });
    });

    it("should use existing ini file if provied", (done) => {
        const EXISTING_INI = join("already", "there", "file.ini");
        const initDoneCb = jest.fn();
        const ny = new NodeYasdi(TEST_ID, CONFIG, EXISTING_INI);
        ny.on("initDone", initDoneCb);

        ny.on("initDone", () => {
            expect(createYasdiIniFileMock).not.toBeCalled();

            expect(YasdiInitMock).toBeCalledTimes(1);
            const [iniPath, deviceDetectCb, newValCb] =
                YasdiInitMock.mock.calls[0];
            expect(iniPath).toBe(EXISTING_INI);
            expect(typeof deviceDetectCb).toBe("function");
            expect(typeof newValCb).toBe("function");

            expect(SearchDevicesAsyncMock).toBeCalledTimes(1);
            expect(SearchDevicesAsyncMock.mock.calls[0][0]).toBe(3);

            expect(initDoneCb).toBeCalledTimes(1);

            done();
        });
    });

    it("should throw if no existing ini file and no serial ports are given", () => {
        expect(() => {
            const ny = new NodeYasdi(TEST_ID, {
                expectedDeviceCount: 3,
                iniFileDir: "path/to/dir",
            });
        }).toThrow();
    });

    it("should use os temp dir when nothing is provied", () => {
        const ny = new NodeYasdi(TEST_ID, {
            expectedDeviceCount: 3,
            serialPorts: ["COM1"],
        });
        expect(createYasdiIniFileMock.mock.calls[0][0]).toBe(tmpdir());
    });

    it("should emit error if yasdi init is not successfull", (done) => {
        YasdiInitMock.mockImplementationOnce(() => {
            return Promise.reject();
        });

        const errCb = jest.fn();

        const ny = new NodeYasdi(TEST_ID, CONFIG);
        ny.on("initErr", errCb);
        ny.on("initErr", () => {
            expect(errCb).toBeCalled();
            done();
        });
    });
});

describe("device search tests", () => {
    it("should create inverter when found and end search", (done) => {
        let devSearchCb: jest.Mock;
        YasdiInitMock.mockImplementation(
            (_iniFilePath, deviceSearchCb, _newValueCb) => {
                devSearchCb = deviceSearchCb;
                return Promise.resolve();
            },
        );

        const deviceSearchEndCb = jest.fn();
        const ny = new NodeYasdi(TEST_ID, CONFIG);
        ny.on("deviceSearchEnd", deviceSearchEndCb);

        ny.on("initDone", () => {
            devSearchCb({ event: "add", handle: 1, miscParam: 0 });
            devSearchCb({ event: "add", handle: 11, miscParam: 0 });
            devSearchCb({ event: "add", handle: 111, miscParam: 0 });
            expect(ny.deviceCount).toBe(3);
            expect(InverterMock).toBeCalledTimes(3);
            expect(InverterMock.mock.calls[0][0]).toBe(1);
            expect(InverterMock.mock.calls[1][0]).toBe(11);
            expect(InverterMock.mock.calls[2][0]).toBe(111);
            devSearchCb({ event: "searchEnd", handle: 3, miscParam: 0 });
            expect(deviceSearchEndCb).toBeCalledTimes(1);
            expect(deviceSearchEndCb.mock.calls[0][0]).toBe(3);
            expect(ny.deviceSearchFinished).toBe(true);
            expect(ny.handles).toEqual([1, 11, 111]);
            expect(ny.serials).toEqual([2, 22, 222]);
            expect(
                ny.getInverterByHandle(1) === ny.getInverterBySerial(2),
            ).toBe(true);
            expect(
                ny.getInverterByHandle(11) === ny.getInverterBySerial(22),
            ).toBe(true);
            expect(
                ny.getInverterByHandle(111) === ny.getInverterBySerial(222),
            ).toBe(true);
            done();
        });
    });

    it("should restart device search if no enough device are found", () => {
        let devSearchCb: jest.Mock;
        YasdiInitMock.mockImplementation(
            (_iniFilePath, deviceSearchCb, _newValueCb) => {
                devSearchCb = deviceSearchCb;
                return Promise.resolve();
            },
        );
        const ny = new NodeYasdi(TEST_ID, {
            expectedDeviceCount: 7,
            iniFileDir: TEST_INI_DIR,
            serialPorts: ["/dev/ttyUSB0"],
        });
        ny.on("initDone", () => {
            expect(SearchDevicesAsyncMock).toBeCalledTimes(1);
            devSearchCb({ event: "add", handle: 1, miscParam: 0 });
            devSearchCb({ event: "add", handle: 11, miscParam: 0 });
            devSearchCb({ event: "add", handle: 111, miscParam: 0 });
            devSearchCb({ event: "searchEnd", handle: 3, miscParam: 0 });
            expect(SearchDevicesAsyncMock).toBeCalledTimes(2);
        });
    });

    it("should delegate the download channel command", () => {
        let devSearchCb: jest.Mock;
        YasdiInitMock.mockImplementation(
            (_iniFilePath, deviceSearchCb, _newValueCb) => {
                devSearchCb = deviceSearchCb;
                return Promise.resolve();
            },
        );
        const onDownloadChannelsCb = jest.fn();
        const ny = new NodeYasdi(TEST_ID, CONFIG);
        ny.on("downloadChannels", onDownloadChannelsCb);
        ny.on("initDone", () => {
            devSearchCb({ event: "add", handle: 1, miscParam: 0 });
            devSearchCb({
                event: "downloadChannels",
                handle: 1,
                miscParam: 33,
            });
            expect(onDownloadChannelsCb).toBeCalledTimes(1);
            expect(onDownloadChannelsCb.mock.calls[0]).toEqual([1, 33]);
            expect(
                (ny.getInverterByHandle(1) as any).onDownloadChannels.mock
                    .calls[0][0],
            ).toBe(33);
        });
    });
});
