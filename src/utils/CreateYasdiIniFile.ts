//© 2021 woifes <https://github.com/woifes>

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";

/**
 * Creates an ini file for yasdi in the given directory. The parameter for the filname will be used unmodified (no file ending will be added).
 * @param iniDir The directory to create the ini file in
 * @param fileName The filename to use (will be used completely unmodified)
 * @param serialPorts A list of serial devices
 * @returns
 */
export function CreateYasdiIniFile(
    iniDir: string,
    fileName: string,
    serialPorts: string[],
    debug = false,
): string {
    let fileContent = "";
    fileContent += "[DriverModules]\n";
    fileContent += "Driver0=yasdi_drv_serial\n\n";

    for (let i = 0; i < serialPorts.length; i++) {
        let d = serialPorts[i];
        if (process.platform === "linux") {
            //TODO no symlink, windows??
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

    const filePath = join(iniDir, fileName);

    writeFileSync(filePath, fileContent, { encoding: "ascii" });

    return filePath;
}
