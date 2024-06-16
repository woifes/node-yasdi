// SPDX-FileCopyrightText: © 2024 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

#ifndef _RESET_YASDI_WORKER
#define _RESET_YASDI_WORKER
#include "libyasdimaster.h"
#include "napi.h"

class ResetYasdiWorker : public Napi::AsyncWorker {
    public:
        ResetYasdiWorker(Napi::Function fn)
            : Napi::AsyncWorker(fn) {
        }
        ~ResetYasdiWorker() {}

        void Execute() {
            yasdiReset();
        }

        void OnError(const Napi::Error& e) {
            e.ThrowAsJavaScriptException();
        }
};

#endif
