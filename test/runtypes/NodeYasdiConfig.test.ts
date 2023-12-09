// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import { NodeYasdiConfig } from "../../src/runtypes/NodeYasdiConfig";

it("should validate correct object", () => {
    expect(() => {
        NodeYasdiConfig.check({
            expectedDeviceCount: 2,
            serialPorts: ["COM1"],
            iniFileDir: "path/to/dir",
        });
    }).not.toThrow();

    expect(() => {
        NodeYasdiConfig.check({
            expectedDeviceCount: 2,
            serialPorts: ["COM1"],
        });
    }).not.toThrow();

    expect(() => {
        NodeYasdiConfig.check({
            expectedDeviceCount: 2,
        });
    }).not.toThrow();
});

it("should not allow expectedDeviceCount 0 or lower", () => {
    expect(() => {
        NodeYasdiConfig.check({
            expectedDeviceCount: 0,
            serialPorts: ["COM1"],
            iniFileDir: "path/to/dir",
        });
    }).toThrow();

    expect(() => {
        NodeYasdiConfig.check({
            expectedDeviceCount: -1,
            serialPorts: ["COM1"],
            iniFileDir: "path/to/dir",
        });
    }).toThrow();
});

it("should not allow serialPorts empty string or empty array", () => {
    expect(() => {
        NodeYasdiConfig.check({
            expectedDeviceCount: 2,
            serialPorts: [""],
            iniFileDir: "path/to/dir",
        });
    }).toThrow();

    expect(() => {
        NodeYasdiConfig.check({
            expectedDeviceCount: 2,
            serialPorts: [],
            iniFileDir: "path/to/dir",
        });
    }).toThrow();
});

it("should not allow empty iniFileDir", () => {
    expect(() => {
        NodeYasdiConfig.check({
            expectedDeviceCount: 2,
            serialPorts: ["COM1"],
            iniFileDir: "",
        });
    }).toThrow();
});
