// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

/**
 * Definition of connection state of a devise (no yasdi feature)
 */
export type inverterComStatus = "offline" | "comError" | "online";

/**
 * Set of properties the yasdi library stores for one value
 */
export type inverterValue = {
    value: number;
    unit: string;
    timeStamp: string;
    statusText: string;
};

/**
 * Maps channel name to value object
 */
export type inverterValues = Map<string, inverterValue>;

/**
 * Set of properties the yasdi libray stores for a channel
 */
export type inverterChannel = {
    handle: number;
    unit: string;
};

/**
 * Maps channel name to channel object
 */
export type inverterChannels = Map<string, inverterChannel>;
