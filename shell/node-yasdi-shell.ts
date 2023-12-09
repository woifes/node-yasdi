#!/usr/bin/env node
// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import { once } from "events";
import { createInterface } from "readline";
import { Inverter, NodeYasdi, YASDI_COM_STATUS_NAME } from "../index";
import { question } from "./util";

const INI_FILE_PATH = process.argv[2];
const BANNER = `_)--  ______
| \\  /_/_/_/ 
    /_/_/_/    Node Yasdi
   /_/_/_/     ==========

`;

if (INI_FILE_PATH === undefined) {
    console.log("No ini file path provided");
    process.exit(1);
}

function hr() {
    console.log("---------------------------------------------");
}

function br() {
    console.log("");
}

function emptyLine() {
    console.log("                                             ");
}

(async () => {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    let nrOfDevices = NaN;

    console.log(BANNER);

    do {
        nrOfDevices = parseInt(
            await question(
                "How many devices shall be searched?",
                "Number of Devices",
                rl,
            ),
        );
    } while (Number.isNaN(nrOfDevices));

    br();
    console.log(`Search for ${nrOfDevices} devices...`);
    console.log(`Using ini file ${INI_FILE_PATH}`);
    br();
    const config = {
        expectedDeviceCount: nrOfDevices,
    };
    const ny = new NodeYasdi("shell", config, INI_FILE_PATH);

    function printDevice(inverter: Inverter) {
        console.log(`Inverter: ${inverter.name}`);
        console.log(`Handle: ${inverter.handle}`);
        console.log(`Serial: ${inverter.serial}`);
        console.log(`Type: ${inverter.type}`);
        hr();
    }

    ny.on("newDevice", (handle: number) => {
        const inverter = ny.getInverterByHandle(handle)!;
        console.log("Found device");
        hr();
        printDevice(inverter);
    });
    await once(ny, "deviceSearchEnd");
    const handles = ny.handles;
    const serials = ny.serials;
    console.log(`found all ${nrOfDevices} devices`);
    br();
    let handle = NaN;
    while (true) {
        const printDeviceValues = async (inverter: Inverter) => {
            const values = await inverter.getData(5);

            const printKeyValue = (key: string, value: string) => {
                const keyPart = `| ${key.padStart(15, " ")}    `;
                const valPart = `    ${value.padEnd(18, " ")}|`;
                console.log(`${keyPart}|${valPart}`);
            };

            const printValue = (value: string) => {
                const rest = (43 - value.length) % 2;
                const space = Math.floor((43 - value.length) / 2);
                const left = space;
                const right = space + rest;
                const formatedValue = `|${" ".repeat(left)}${value}${" ".repeat(
                    right,
                )}|`;
                console.log(formatedValue);
            };

            hr();

            const timeStr = new Date(
                values.get(YASDI_COM_STATUS_NAME)!.timeStamp,
            ).toLocaleString();
            printValue(timeStr);
            printValue(inverter.name);

            hr();

            printKeyValue("handle", inverter.handle.toString());
            printKeyValue("type", inverter.type);
            printKeyValue("serial", inverter.serial.toString());

            hr();
            console.log("| Channel/value name | Channel value (Unit) |");
            hr();

            for (const [valueName, value] of values) {
                const valStr =
                    value.unit.length === 0 && value.statusText.length !== 0
                        ? value.statusText
                        : `${value.value.toFixed(2)} (${value.unit})`;
                printKeyValue(valueName, valStr);
            }
            hr();
        };

        console.log(`Serials: [${serials}]`);
        console.log(`Handles: [${handles}]`);
        br();
        const handleRaw = await question(
            "For which handle or serial should the data be fetched? (enter 'exit' to exit shell)",
            "handle/serial (or 'exit' to exit)",
            rl,
        );
        handle = parseInt(handleRaw);
        if (!Number.isNaN(handle)) {
            const inverterByHandle = ny.getInverterByHandle(handle);
            const inverterBySerial = ny.getInverterBySerial(handle);
            if (inverterByHandle !== undefined) {
                console.log(
                    `Fetching data from serial ${inverterByHandle.serial}...`,
                );
                await printDeviceValues(inverterByHandle);
                br();
            } else if (inverterBySerial !== undefined) {
                console.log(
                    `Fetching data from serial ${inverterBySerial.serial}...`,
                );
                await printDeviceValues(inverterBySerial);
                br();
            } else {
                console.log("No inverter with this handle was found");
                console.log("These inverter are present:");
                br();

                for (const handle of handles[Symbol.iterator]()) {
                    const inverter = ny.getInverterByHandle(handle)!;
                    printDevice(inverter);
                }
                br();
            }
        } else if (handleRaw === "exit") {
            process.exit(0);
        } else {
            console.log("No inverter with this handle was found");
            console.log("These inverter are present:");
            br();

            for (const handle of handles[Symbol.iterator]()) {
                const inverter = ny.getInverterByHandle(handle)!;
                printDevice(inverter);
            }
            br();
        }
    }
})();
