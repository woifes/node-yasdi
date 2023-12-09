// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import { writeFileSync } from "fs";
import { join } from "path";
import { createYasdiIniFile } from "../../src/util/createYasdiIniFile";
jest.mock("fs");

const writeFileSyncMock = writeFileSync as unknown as jest.Mock;
const TEST_DIR = join("path", "to");
const TEST_FILE_NAME = "test.ini";
const TEST_FULL_PATH = join(TEST_DIR, TEST_FILE_NAME);

afterEach(() => {
    jest.clearAllMocks();
});

it("should create file with all items", () => {
    expect(createYasdiIniFile(TEST_DIR, TEST_FILE_NAME, ["COM1"], true)).toBe(
        TEST_FULL_PATH,
    );
    const [filePath, content] = writeFileSyncMock.mock.calls[0];
    expect(filePath).toBe(TEST_FULL_PATH);
    expect(content).toBe(`[DriverModules]
Driver0=yasdi_drv_serial

[COM1]
Device=COM1
Media=RS485
Baudrate=1200
Protocol=SMANet

[Misc]
DebugOutput=/dev/stdout
`);
});

it("should create without debug output", () => {
    expect(createYasdiIniFile(TEST_DIR, TEST_FILE_NAME, ["COM1"])).toBe(
        TEST_FULL_PATH,
    );
    const content = writeFileSyncMock.mock.calls[0][1];
    expect(content).toBe(`[DriverModules]
Driver0=yasdi_drv_serial

[COM1]
Device=COM1
Media=RS485
Baudrate=1200
Protocol=SMANet

`);
});

it("should file with multible com ports", () => {
    expect(
        createYasdiIniFile(
            TEST_DIR,
            TEST_FILE_NAME,
            ["COM1", "COM2", "COM11"],
            true,
        ),
    ).toBe(TEST_FULL_PATH);
    const [filePath, content] = writeFileSyncMock.mock.calls[0];
    expect(filePath).toBe(TEST_FULL_PATH);
    expect(content).toBe(`[DriverModules]
Driver0=yasdi_drv_serial

[COM1]
Device=COM1
Media=RS485
Baudrate=1200
Protocol=SMANet

[COM2]
Device=COM2
Media=RS485
Baudrate=1200
Protocol=SMANet

[COM3]
Device=COM11
Media=RS485
Baudrate=1200
Protocol=SMANet

[Misc]
DebugOutput=/dev/stdout
`);
});
