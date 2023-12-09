#!/usr/bin/env node
// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import { createInterface } from "readline";
import { createYasdiIniFileContent } from "../index";
import { question } from "./util";

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

(async () => {
    const serialPorts: string[] = [];
    while (true) {
        const serialPort = await question(
            "Please enter serial device",
            "Serial device:",
            rl,
        );
        if (serialPort.length === 0) {
            break;
        }
        serialPorts.push(serialPort);
    }

    if (serialPorts.length === 0) {
        console.log("Error no serial device provided");
        process.exit(1);
    }

    let debug = false;
    const debugAnswer = await question(
        "Do you want to add debug config to ini file? (y/n)",
        "debug (y/n)?",
        rl,
    );
    debugAnswer.toUpperCase();
    if (debugAnswer === "Y") {
        debug = true;
    }
    console.error(createYasdiIniFileContent(serialPorts, debug));
    process.exit(0);
})();
