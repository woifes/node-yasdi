// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import * as rt from "runtypes";

export const NodeYasdiConfig = rt.Record({
    expectedDeviceCount: rt.Number.withConstraint((n) => n > 0),
    serialPorts: rt
        .Array(
            rt.String.withConstraint(
                (s) => s.length > 0 || "Serial device must not be empty",
            ),
        )
        .withConstraint((a) => a.length > 0 || "No serial device given")
        .optional(),
    iniFileDir: rt.String.withConstraint(
        (s) => s.length > 0 || "Ini file directory must not be empty",
    ).optional(),
});

/**
 * @param expectedDeviceCount number of devices the yasdi library shall search
 * @param serialPorts an array of strings which hold a list of serial devices
 * @param iniFileDir path to the ini file the yasdi library shall use
 */
export type tNodeYasdiConfig = rt.Static<typeof NodeYasdiConfig>;
