// SPDX-FileCopyrightText: © 2024 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

#ifndef _SHUTDOWN_YASDI_WORKER
#define _SHUTDOWN_YASDI_WORKER
#include "libyasdimaster.h"
#include "napi.h"

class ShutdownYasdiWorker : public Napi::AsyncWorker {
    public:
        ShutdownYasdiWorker(Napi::Function fn)
            : Napi::AsyncWorker(fn) {
        }
        ~ShutdownYasdiWorker() {}

        void Execute() {
            yasdiMasterShutdown();
        }

        void OnError(const Napi::Error& e) {
            e.ThrowAsJavaScriptException();
        }
};

#endif
