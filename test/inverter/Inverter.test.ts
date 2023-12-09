// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import { NodeYasdi } from "../../src/NodeYasdi";
import {
    getChannelValue,
    getChannelsOfDevice,
    getNameOfDevice,
    getSerialOfDevice,
    getTypeOfDevice,
} from "../../src/bindings/yasdiBindings";
import { Inverter } from "../../src/inverter/Inverter";
jest.mock("../../src/NodeYasdi");
jest.mock("../../src/bindings/yasdiBindings");
jest.useFakeTimers();
const NOW = new Date(2000, 1, 29, 12, 0);
jest.setSystemTime(NOW);

const GetSerialOfDeviceMock = (
    getSerialOfDevice as unknown as jest.Mock
).mockImplementation(() => 123456);
const GetTypeOfDeviceMock = (
    getTypeOfDevice as unknown as jest.Mock
).mockImplementation(() => "TestDevice");
const GetNameOfDeviceMock = (
    getNameOfDevice as unknown as jest.Mock
).mockImplementation(() => "John");
const GetChannelsOfDeviceMock = (
    getChannelsOfDevice as unknown as jest.Mock
).mockImplementation(() => {
    return {
        channelCount: 6,
        channels: {
            Pac: { handle: 1, unit: "W" },
            "E-Total": { handle: 2, unit: "kWh" },
            "h-Total": { handle: 3, unit: "h" },
            Fehler: { handle: 4, unit: "" },
            Status: { handle: 5, unit: "" },
            Volt: { handle: 6, unit: "V" },
        },
    };
});
const GetChannelValueMock = (
    getChannelValue as unknown as jest.Mock
).mockImplementation(
    (_deviceHandle: number, channelHandle: number, _maxAge: number) => {
        const val = {
            value: 1,
            statusText: "",
            result: 0,
            timeStamp: 1000,
        };
        switch (channelHandle) {
            case 1:
                val.value = 101;
                break;
            case 2:
                val.value = 1001;
                break;
            case 3:
                val.value = 2001;
                break;
            case 4:
                val.value = 0;
                val.statusText = "---";
                break;
            case 5:
                val.value = 0;
                val.statusText = "Mpp";
                break;
            case 6:
                val.value = 230;
                break;
        }
        return Promise.resolve(val);
    },
);

const NODE_YASDI = new NodeYasdi("test01", {
    expectedDeviceCount: 3,
});

describe("Creation tests", () => {
    it("should setup inverter object correctly", () => {
        const i = new Inverter(1, NODE_YASDI);
        NODE_YASDI.emit("deviceSearchEnd");
        expect(i.serial).toBe(123456);
        expect(i.type).toBe("TestDevice");
        expect(i.name).toBe("John");
        expect(i.channelsComplete).toBe(true);
        expect(i.channelNames).toEqual([
            "yasdiComStatus",
            "Pac",
            "E-Total",
            "h-Total",
            "Fehler",
            "Status",
            "Volt",
        ]);
        expect(i.comStatus).toBe("offline");
    });
});

describe("getData tests", () => {
    it("should get the data without errors", async () => {
        const i = new Inverter(1, NODE_YASDI);
        NODE_YASDI.emit("deviceSearchEnd");
        const res = await i.getData(3);
        expect(res.size).toBe(7);
        expect(res).toEqual(
            new Map([
                [
                    "yasdiComStatus",
                    {
                        statusText: "online",
                        timeStamp: "2000-02-29T11:00:00.000Z",
                        unit: "",
                        value: 0,
                    },
                ],
                [
                    "E-Total",
                    {
                        statusText: "",
                        timeStamp: "1970-01-01T00:16:40.000Z",
                        unit: "kWh",
                        value: 1001,
                    },
                ],
                [
                    "Fehler",
                    {
                        statusText: "---",
                        timeStamp: "1970-01-01T00:16:40.000Z",
                        unit: "",
                        value: 0,
                    },
                ],
                [
                    "Pac",
                    {
                        statusText: "",
                        timeStamp: "1970-01-01T00:16:40.000Z",
                        unit: "W",
                        value: 101,
                    },
                ],
                [
                    "Status",
                    {
                        statusText: "Mpp",
                        timeStamp: "1970-01-01T00:16:40.000Z",
                        unit: "",
                        value: 0,
                    },
                ],
                [
                    "Volt",
                    {
                        statusText: "",
                        timeStamp: "1970-01-01T00:16:40.000Z",
                        unit: "V",
                        value: 230,
                    },
                ],
                [
                    "h-Total",
                    {
                        statusText: "",
                        timeStamp: "1970-01-01T00:16:40.000Z",
                        unit: "h",
                        value: 2001,
                    },
                ],
            ]),
        );
        expect(i.comStatus).toBe("online");
    });
});

it("should emit channel values", async () => {
    const i = new Inverter(1, NODE_YASDI);
    NODE_YASDI.emit("deviceSearchEnd");
    const valueCb = jest.fn();
    const comStatusCb = jest.fn();

    i.on("newValue", valueCb);
    i.on("comStatus", comStatusCb);

    await i.getData(3);
    expect(comStatusCb).toBeCalledTimes(1);
    expect(comStatusCb.mock.calls[0][0]).toBe("online");
    const calls = valueCb.mock.calls;
    expect(valueCb).toBeCalledTimes(7);
    expect(calls[0][0]).toBe("Pac");
    expect(calls[0][1]).toEqual({
        statusText: "",
        timeStamp: "1970-01-01T00:16:40.000Z",
        unit: "W",
        value: 101,
    });
    expect(calls[1][0]).toBe("E-Total");
    expect(calls[1][1]).toEqual({
        statusText: "",
        timeStamp: "1970-01-01T00:16:40.000Z",
        unit: "kWh",
        value: 1001,
    });
    expect(calls[2][0]).toBe("h-Total");
    expect(calls[2][1]).toEqual({
        statusText: "",
        timeStamp: "1970-01-01T00:16:40.000Z",
        unit: "h",
        value: 2001,
    });
    expect(calls[3][0]).toBe("Fehler");
    expect(calls[3][1]).toEqual({
        statusText: "---",
        timeStamp: "1970-01-01T00:16:40.000Z",
        unit: "",
        value: 0,
    });
    expect(calls[4][0]).toBe("Status");
    expect(calls[4][1]).toEqual({
        statusText: "Mpp",
        timeStamp: "1970-01-01T00:16:40.000Z",
        unit: "",
        value: 0,
    });
    expect(calls[5][0]).toBe("Volt");
    expect(calls[5][1]).toEqual({
        statusText: "",
        timeStamp: "1970-01-01T00:16:40.000Z",
        unit: "V",
        value: 230,
    });
    expect(calls[6][0]).toBe("yasdiComStatus");
    expect(calls[6][1]).toEqual({
        statusText: "online",
        timeStamp: "2000-02-29T11:00:00.000Z",
        unit: "",
        value: 0,
    });
});

it("should go offline if -3 result is received", async () => {
    GetChannelValueMock.mockImplementation(
        (_deviceHandle: number, channelHandle: number, _maxAge: number) => {
            const val = {
                value: 1,
                statusText: "",
                result: 0,
                timeStamp: 1000,
            };
            switch (channelHandle) {
                case 1:
                    val.value = 101;
                    break;
                case 2:
                    val.result = -3;
                    val.value = 1001;
                    break;
                case 3:
                    val.value = 2001;
                    break;
                case 4:
                    val.value = 0;
                    val.statusText = "---";
                    break;
                case 5:
                    val.value = 0;
                    val.statusText = "Mpp";
                    break;
                case 6:
                    val.value = 230;
                    break;
                case 7:
                    val.value = 3001;
                    break;
            }
            return Promise.resolve(val);
        },
    );
    const i = new Inverter(1, NODE_YASDI);
    NODE_YASDI.emit("deviceSearchEnd");
    const res = await i.getData(3);
    expect(res.size).toBe(2);
    expect(res).toEqual(
        new Map([
            [
                "yasdiComStatus",
                {
                    statusText: "offline",
                    timeStamp: "2000-02-29T11:00:00.000Z",
                    unit: "",
                    value: 0,
                },
            ],
            [
                "Pac",
                {
                    statusText: "",
                    timeStamp: "1970-01-01T00:16:40.000Z",
                    unit: "W",
                    value: 101,
                },
            ],
        ]),
    );
    expect(i.comStatus).toBe("offline");
});

it("should set comError when result is other bad error code", async () => {
    GetChannelValueMock.mockImplementation(
        (_deviceHandle: number, channelHandle: number, _maxAge: number) => {
            const val = {
                value: 1,
                statusText: "",
                result: 0,
                timeStamp: 1000,
            };
            switch (channelHandle) {
                case 1:
                    val.value = 101;
                    break;
                case 2:
                    val.result = -11;
                    val.value = 1001;
                    break;
                case 3:
                    val.value = 2001;
                    break;
                case 4:
                    val.value = 0;
                    val.statusText = "---";
                    break;
                case 5:
                    val.value = 0;
                    val.statusText = "Mpp";
                    break;
                case 6:
                    val.value = 230;
                    break;
                case 7:
                    val.value = 3001;
                    break;
            }
            return Promise.resolve(val);
        },
    );
    const i = new Inverter(1, NODE_YASDI);
    NODE_YASDI.emit("deviceSearchEnd");
    const res = await i.getData(3);
    expect(res.size).toBe(2);
    expect(res).toEqual(
        new Map([
            [
                "yasdiComStatus",
                {
                    statusText: "comError",
                    timeStamp: "2000-02-29T11:00:00.000Z",
                    unit: "",
                    value: 0,
                },
            ],
            [
                "Pac",
                {
                    statusText: "",
                    timeStamp: "1970-01-01T00:16:40.000Z",
                    unit: "W",
                    value: 101,
                },
            ],
        ]),
    );
    expect(i.comStatus).toBe("comError");
});
