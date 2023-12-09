// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

import { Interface } from "readline";

export async function question(
    questionText: string,
    answerName: string,
    intf: Interface,
): Promise<string> {
    return new Promise((resolve, reject) => {
        intf.question(
            `${questionText}\n\n${answerName}: `,
            (answer: string) => {
                resolve(answer);
            },
        );
    });
}
