// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import bindings from "bindings";

const yasdiBindings = bindings("yasdi-bindings.node");

export type GetChannelsResult = {
    channelCount: number;
    channels: {
        [name: string]: {
            handle: number;
            unit: string;
        };
    };
};

export type GetChannelValueResult = {
    value: number;
    statusText: string;
    result: number;
    timeStamp: number;
};

export type DeviceDetectionEvent = {
    event: "add" | "remove" | "searchEnd" | "downloadChannels";
    handle: number;
    miscParam: number;
};

const _init = yasdiBindings.Init as (
    iniPath: string,
    deviceDetectionCb: (evt: DeviceDetectionEvent) => void,
    newValueCb: () => void,
    cb: () => void,
) => void;

export const searchDevicesAsync = yasdiBindings.SearchDevicesAsync as (
    expectedNumberOfDevice: number,
) => number;

const _getChannelValue = yasdiBindings.GetChannelValue as (
    deviceHandle: number,
    channelHandle: number,
    maxValAge: number,
    cb: (result: GetChannelValueResult) => void,
) => void;

export const getChannelsOfDevice = yasdiBindings.GetChannelsOfDevice as (
    deviceHandle: number,
) => GetChannelsResult;

export const getSerialOfDevice = yasdiBindings.GetSerialOfDevice as (
    deviceHandle: number,
) => number;

export const getNameOfDevice = yasdiBindings.GetNameOfDevice as (
    deviceHandle: number,
) => string;

export const getTypeOfDevice = yasdiBindings.GetTypeOfDevice as (
    deviceHandle: number,
) => string;

export const getDeviceHandles =
    yasdiBindings.GetDeviceHandles as () => number[];

export function getChannelValue(
    deviceHandle: number,
    channelHandle: number,
    maxAgeS: number,
): Promise<GetChannelValueResult> {
    return new Promise((resolve, reject) => {
        _getChannelValue(
            deviceHandle,
            channelHandle,
            maxAgeS,
            (result: GetChannelValueResult) => {
                resolve(result);
            },
        );
    });
}

export function yasdiInit(
    iniPath: string,
    deviceDetectionCb: (event: DeviceDetectionEvent) => void,
    newValueCb: () => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            _init(iniPath, deviceDetectionCb, newValueCb, () => {
                resolve();
            });
        } catch (err) {
            reject(err);
        }
    });
}
