// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";

/**
 * Creates a minimal content for a yasdi ini file the library needs
 * @param serialPorts an array of serial devices
 * @param debug specifies if there should be a debug configuration for the yasdi library
 * @returns the content for the yasdi ini file
 */
export function createYasdiIniFileContent(
    serialPorts: string[],
    debug = false,
): string {
    let fileContent = "";
    fileContent += "[DriverModules]\n";
    fileContent += "Driver0=yasdi_drv_serial\n\n";

    for (let i = 0; i < serialPorts.length; i++) {
        let d = serialPorts[i];
        if (process.platform === "linux") {
            if (d.split("/").length >= 2) {
                d = execSync(`readlink -f ${d}`).toString().split("\n")[0];
            }
        }
        fileContent += `[COM${i + 1}]\n`;
        fileContent += `Device=${d}\n`;
        fileContent += "Media=RS485\n";
        fileContent += "Baudrate=1200\n";
        fileContent += "Protocol=SMANet\n\n";
    }
    if (debug) {
        fileContent += "[Misc]\n";
        fileContent += "DebugOutput=/dev/stdout\n";
    }

    return fileContent;
}

/**
 * Creates a minimal ini file for yasdi in the given directory. The parameter for the filename will be used unmodified (no file ending will be added).
 * @param iniDir The directory to create the ini file in
 * @param fileName The filename to use (will be used completely unmodified)
 * @param serialPorts A list of serial devices
 * @returns the file path where the ini file was created
 */
export function createYasdiIniFile(
    iniDir: string,
    fileName: string,
    serialPorts: string[],
    debug = false,
): string {
    const fileContent = createYasdiIniFileContent(serialPorts, debug);

    const filePath = join(iniDir, fileName);

    writeFileSync(filePath, fileContent, { encoding: "ascii" });

    return filePath;
}
