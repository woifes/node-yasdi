// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import { EventEmitter } from "events";
import { Debugger, debug } from "debug";
import { NodeYasdi } from "../NodeYasdi";
import {
    GetChannelValueResult,
    getChannelValue,
    getChannelsOfDevice,
    getNameOfDevice,
    getSerialOfDevice,
    getTypeOfDevice,
} from "../bindings/yasdiBindings";
import {
    inverterChannels,
    inverterComStatus,
    inverterValue,
    inverterValues,
} from "./inverterTypes";

export const YASDI_COM_STATUS_NAME = "yasdiComStatus";
export type yasdiComStatusTypeName = typeof YASDI_COM_STATUS_NAME;

export declare interface Inverter {
    /**
     * Emitted when the communication status changes.
     * values:
     * * "online" - Normal communication
     * * "offline" - Inverter no more reachable (also happens regularly when sun goes down)
     * * "comError" - Yasdi library reported communication error
     */
    on(event: "comStatus", listener: (status: inverterComStatus) => void): this;

    /**
     * Emitted when a value is updated. Emits the value name and the value Map.
     */
    on(
        event: "newValue",
        listener: (valueName: string, value: inverterValue) => void,
    ): this;

    /**
     * Emitted when the yasdi com status is updated.
     */
    on(
        event: "newValue",
        listener: (
            valueName: yasdiComStatusTypeName,
            value: inverterValue,
        ) => void,
    ): this;
}

export class Inverter extends EventEmitter {
    private _handle: number;
    private _nodeYasdi: NodeYasdi;
    private _serial: number;
    private _type: string;
    private _name: string;
    private _comStatus: inverterComStatus = "offline";
    private _channels: inverterChannels = new Map();
    private _values: inverterValues = new Map();
    private _debug: Debugger;
    private _debugGetData: Debugger;

    constructor(handle: number, nodeYasdi: NodeYasdi) {
        super();
        this._handle = handle;
        this._nodeYasdi = nodeYasdi;
        this._serial = getSerialOfDevice(this._handle);
        this._type = getTypeOfDevice(this._handle);
        this._name = getNameOfDevice(this._handle);
        this.setComStatus("offline");
        this._debug = debug(`Inverter(${this._serial})`);
        this._debugGetData = this._debug.extend("getData");
        this._nodeYasdi.on("deviceSearchEnd", () => {
            this.onDeviceSearchEnd();
        });
        this._debugGetData = this._debug.extend("getData");
        this._nodeYasdi.on(
            "downloadChannels",
            (handle: number, miscParam: number) => {
                if (handle === this._handle) {
                    this.onDownloadChannels(miscParam);
                }
            },
        );
    }

    /**
     * The yasdi communication status
     */
    get comStatus(): inverterComStatus {
        return this._comStatus;
    }

    /**
     * Serial of the device
     */
    get serial(): number {
        return this._serial;
    }

    /**
     * Device handle for the yasdi library
     */
    get handle(): number {
        return this._handle;
    }

    /**
     * The device type reported form yasdi
     */
    get type(): string {
        return this._type;
    }

    /**
     * The device name reported by yasdi
     */
    get name(): string {
        return this._name;
    }

    private setComStatus(c: inverterComStatus) {
        this.mapValue(YASDI_COM_STATUS_NAME, "", {
            result: 0,
            timeStamp: Math.floor(Date.now() / 1000),
            value: 0,
            statusText: c,
        });
        this._comStatus = c;
        this.emit("comStatus", c);
    }

    /**
     * Indicates when all channels are loaded from the inverter (necessary before reading values)
     */
    get channelsComplete(): boolean {
        return this._channels.size > 0;
    }

    /**
     * Returns the available channels
     */
    get channelNames(): string[] {
        return [YASDI_COM_STATUS_NAME, ...Array.from(this._channels.keys())];
    }

    /**
     * Returns the current values (does not fetch new values)
     * @see getData() for fetching new values
     */
    get values(): inverterValues {
        return this._values;
    }

    /**
     * Returns the value object for a given name.
     * @param valueName the value name to return
     * @returns the value object or undefined if name is not found
     */
    getValueByName(valueName: string) {
        return this._values.get(valueName);
    }

    private onDeviceSearchEnd() {
        if (!this.channelsComplete) {
            this._debug("device search ended load channels...");
            this.loadChannels();
        }
    }

    private loadChannels() {
        const { channelCount, channels } = getChannelsOfDevice(this._handle);
        if (channelCount > 0) {
            this._debug(`loaded ${channelCount} channels`);
            for (const channel of Object.keys(channels)) {
                this._channels.set(channel, channels[channel]);
            }
        } else {
            this._debug(`loaded no channels. count: ${channelCount}`);
        }
    }

    private onDownloadChannels(miscParam: number) {
        this._debug(`onDownloadChannels. param: ${miscParam}`);
        //miscParams seems to be a progress value from 0-100 when channels are loaded
        /* if(miscParam == 100) {
            if(!this.channelsComplete) {
                this.loadChannels();
            }
        } */
    }

    /**
     * Fetches new data from the inverter. Stores the result in the current data object.
     * If one value has its result set to -3 (timeout) it is assumed the device is offline because of the sunset.
     * In this case no value after that is updated, which means every value has to be seen as invalid.
     * @see values property
     * @param maxValueAgeS maximal value age in seconds (yasdi will fetch new ones if the cached values are older than the given time)
     * @returns Promise which resolves with the value object
     */
    async getData(maxValueAgeS: number): Promise<inverterValues> {
        if (!this._nodeYasdi.deviceSearchFinished) {
            this._debugGetData(
                "instant finish of getData() because device search not yet finished",
            );
            return Promise.resolve(this._values);
        }

        let comStatus: inverterComStatus = "online"; //if channel fetching worked set status

        for (const val of this.getChannelValues(maxValueAgeS)) {
            const res: GetChannelValueResult = await val.prom;
            if (res.result === 0) {
                this._debugGetData(`loaded channel: ${JSON.stringify(res)}`);
                this.mapValue(val.chanName, val.chan.unit, res);
            } else {
                if (res.result === -3) {
                    comStatus = "offline"; //device not reachable, but this can be ok if the sun goes down
                } else {
                    comStatus = "comError";
                }
                this._debugGetData(
                    `Result value was ${res.result} for value ${val.chanName} - break`,
                );
                break;
            }
        }
        this.setComStatus(comStatus);
        return this._values;
    }

    /**
     * Generatorfunction for all channels of the device.
     */
    private *getChannelValues(maxValueAgeS: number) {
        if (this._channels.size > 0) {
            for (const [channelName, channel] of this._channels.entries()) {
                yield {
                    chanName: channelName,
                    chan: channel,
                    prom: getChannelValue(
                        this._handle,
                        channel.handle,
                        maxValueAgeS,
                    ),
                };
            }
        }
    }

    private mapValue(
        channelName: string,
        unit: string,
        newValue: GetChannelValueResult,
    ) {
        const timeStamp = new Date(newValue.timeStamp * 1000).toJSON();

        let existingValueObj = this._values.get(channelName);

        if (existingValueObj === undefined) {
            existingValueObj = {
                value: newValue.value,
                unit: unit,
                timeStamp: timeStamp,
                statusText: newValue.statusText,
            };
            this._values.set(channelName, existingValueObj);
        } else {
            existingValueObj.value = newValue.value;
            existingValueObj.unit = unit;
            existingValueObj.timeStamp = timeStamp;
            existingValueObj.statusText = newValue.statusText;
        }

        this.emit("newValue", channelName, { ...existingValueObj });
    }
}
