// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

#ifndef _INIT_YASDI_WORKER
#define _INIT_YASDI_WORKER
#ifdef WINDOWS
#include <windows.h>
#endif
#include "libyasdimaster.h"
#include "napi.h"
#include <string>
#include <iostream>


class InitYasdiWorker : public Napi::AsyncWorker {
    public:
        InitYasdiWorker(Napi::Function fn, std::string path, void* searchEventCb, void* newValueEventCb)
            : Napi::AsyncWorker(fn), iniFilePath(path), searchEvtCb(searchEventCb), newValueEventCb(newValueEventCb) {
        }
        ~InitYasdiWorker() {}

        void Execute() {
            DWORD dwDC = 1;
            int res = yasdiMasterInitialize(iniFilePath.c_str(), &dwDC);
            if(res == -1) {
                std::string err("No ini-File found!: ");
                err = err + iniFilePath;
                Napi::AsyncWorker::SetError(err);
            }  else {
                yasdiMasterAddEventListener(searchEvtCb, YASDI_EVENT_DEVICE_DETECTION);
                yasdiMasterAddEventListener(newValueEventCb, YASDI_EVENT_CHANNEL_NEW_VALUE);
                DWORD drivers[10];
                DWORD driverNum = yasdiMasterGetDriver(drivers, 10);
                for(int i = 0; i < (int)driverNum; i++) {
                    if(!yasdiMasterSetDriverOnline( drivers[i] )) {
                        std::string err(std::string("Error at starting up driver: ") + std::to_string((int)driverNum));
                        Napi::AsyncWorker::SetError(err);
                        return;
                    }
                }
            }
        }

        void OnError(const Napi::Error& e) {
            e.ThrowAsJavaScriptException();
        }

    private:
        std::string iniFilePath;
        void* searchEvtCb;
        void* newValueEventCb;
};


#endif