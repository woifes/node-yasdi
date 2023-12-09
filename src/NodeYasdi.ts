// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import { EventEmitter } from "events";
import { tmpdir } from "os";
import { Debugger, debug } from "debug";
import {
    DeviceDetectionEvent,
    searchDevicesAsync,
    yasdiInit,
} from "./bindings/yasdiBindings";
import { Inverter } from "./inverter/Inverter";
import { NodeYasdiConfig, tNodeYasdiConfig } from "./runtypes/NodeYasdiConfig";
import { createYasdiIniFile } from "./util/createYasdiIniFile";

export declare interface NodeYasdi {
    /**
     * Is fired when the init process of the yasdi library is finished.
     * @param listener the event listener
     */
    on(event: "initDone", listener: () => void): this;
    /**
     * Is fired when the init of the yasdi library encountered an error.
     * @param listener the event listener
     */
    on(event: "initErr", listener: (err: any) => void): this;
    /**
     * Is fired when a new device is found by the yasdi library. Gives the device handle as callback parameter.
     * @param listener the event listener
     */
    on(event: "newDevice", listener: (handle: number) => void): this;
    /**
     * Is fired when the download of the device channel was finished. Gives the device handle of the corresponding device and a misc param (from the library) as callback parameter.
     * @param listener the event listener
     */
    on(
        event: "downloadChannels",
        listener: (handle: number, miscParam: number) => void,
    ): this;
    /**
     * Is fired when the device search of the yasdi library is finished. After this fetching data of the devices is possible.
     * @param listener the event listener
     */
    on(event: "deviceSearchEnd", listener: (deviceCount: number) => void): this;
}

/**
 *
 */
export class NodeYasdi extends EventEmitter {
    private _config: tNodeYasdiConfig;
    private _id: string;
    private _iniFilePath: string;
    private _inverter: Map<number, Inverter> = new Map<number, Inverter>();
    private _inverterBySerial: Map<number, Inverter> = new Map<
        number,
        Inverter
    >();
    private _deviceSearchFinished = false;
    private _debug: Debugger;

    /**
     * Constructs the yasdi library proxy object. Start the init and device search process.
     * @param id id of the object (for debug reasons)
     * @param config the configuration object
     * @param existingIniFilePath the path to the ini file the yasdi library shall use.
     * If this is omitted the necessary information for creating an ini file has to be given in the config.
     */
    constructor(
        id: string,
        config: tNodeYasdiConfig,
        existingIniFilePath?: string,
        yasdiDebug = false,
    ) {
        super();
        this._config = NodeYasdiConfig.check(config);
        this._id = id;
        this._debug = debug(`NodeYasdi(${this._id})`);
        const iniFileDir = this._config.iniFileDir ?? tmpdir();
        if (existingIniFilePath === undefined) {
            if (this._config.serialPorts !== undefined) {
                this._iniFilePath = createYasdiIniFile(
                    iniFileDir,
                    `${this._id}.ini`,
                    this._config.serialPorts,
                    yasdiDebug,
                );
                this._debug(`Created Ini-File at ${this._iniFilePath}`);
            } else {
                throw new Error(
                    "No existing ini file, nor information to create a ini file provided",
                );
            }
        } else {
            this._iniFilePath = existingIniFilePath;
            this._debug(`Use existing ini-file at ${this._iniFilePath}`);
        }

        yasdiInit(
            this._iniFilePath,
            (event: DeviceDetectionEvent) => {
                this.onDeviceDetection(event);
            },
            (...args: any[]) => {
                this.onNewValue(...args);
            },
        )
            .then(() => {
                this.onInitDone();
            })
            .catch((err) => {
                this.emit("initErr", err);
            });
    }

    /**
     * Returns if the device search of the yasdi library is finished.
     */
    get deviceSearchFinished(): boolean {
        return this._deviceSearchFinished;
    }

    /**
     * Returns the current number of found devices.
     */
    get deviceCount(): number {
        return this._inverter.size;
    }

    /**
     * Returns an array of all device handles (managed by the yasdi library)
     */
    get handles(): number[] {
        return Array.from(this._inverter.keys());
    }

    /**
     * Returns an array of all device serial numbers
     */
    get serials(): number[] {
        return Array.from(this._inverterBySerial.keys());
    }

    /**
     * Searches an inverter by handle
     * @param handle the handle
     * @returns the inverter object for the given device handle
     */
    getInverterByHandle(handle: number) {
        return this._inverter.get(handle);
    }

    /**
     * Searches an inverter by serial number
     * @param serial the serial number
     * @returns the inverter object for the given serial number
     */
    getInverterBySerial(serial: number) {
        return this._inverterBySerial.get(serial);
    }

    private onInitDone() {
        searchDevicesAsync(this._config.expectedDeviceCount);
        this.emit("initDone");
    }

    private onDeviceDetection(result: DeviceDetectionEvent) {
        const { event, handle, miscParam } = result;
        switch (event) {
            case "add":
                this.onAddDevice(handle);
                break;
            case "remove":
                this._debug(
                    `Yasdi remove event occurred: handle(${handle}), miscParam(${miscParam})`,
                );
                break;
            case "searchEnd":
                if (handle === this.deviceCount) {
                    this.onDeviceSearchEnd();
                } else {
                    this._debug(
                        `Device search ended unfinished (${this.deviceCount}/${this._config.expectedDeviceCount})`,
                    );
                    searchDevicesAsync(this._config.expectedDeviceCount);
                }
                break;
            case "downloadChannels":
                this.onDownloadChannels(handle, miscParam);
                break;
        }
    }

    private onAddDevice(handle: number) {
        if (this._inverter.get(handle) === undefined) {
            this._debug(`Found new device. handle: ${handle}`);
            this._inverter.set(handle, new Inverter(handle, this));
            this.emit("newDevice", handle);
        } else {
            this._debug(
                `Found device handle is already present. handle: ${handle}`,
            );
        }
    }

    private onDownloadChannels(handle: number, miscParam: number) {
        const inverter = this._inverter.get(handle);
        if (inverter !== undefined) {
            this._debug(
                `onDownloadChannels event occurred. handle(${handle}), miscParam(${miscParam})`,
            );
            this.emit("downloadChannels", handle, miscParam);
        } else {
            this._debug(
                `onDownloadChannels event for not found device. handle(${handle}), miscParam(${miscParam})`,
            );
        }
    }

    private onDeviceSearchEnd() {
        this._deviceSearchFinished = true;
        this.mapSerialsOfInverter();
        this._debug(
            `Device search ended successfully. Device count: ${this.deviceCount}`,
        );
        this.emit("deviceSearchEnd", this.deviceCount);
    }

    private mapSerialsOfInverter() {
        for (const inv of this._inverter.values()) {
            this._inverterBySerial.set(inv.serial, inv);
        }
    }

    private onNewValue(...args: any[]) {
        this._debug(`onNewValue event occurred: ${args}`);
    }
}
