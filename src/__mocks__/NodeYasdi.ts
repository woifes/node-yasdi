// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import { EventEmitter } from "events";

export class NodeYasdi extends EventEmitter {
    get deviceSearchFinished(): boolean {
        return true;
    }
}
