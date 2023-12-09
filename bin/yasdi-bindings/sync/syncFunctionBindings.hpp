// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

#ifndef _SYNC_FUNCTION_BINDINGS
#define _SYNC_FUNCTION_BINDINGS

#include "napi.h"

Napi::Object getChannelsOfDevice(const Napi::CallbackInfo& info);
Napi::Value getSerialOfDevice(const Napi::CallbackInfo& info);
Napi::Value getNameOfDevice(const Napi::CallbackInfo& info);
Napi::Value getTypeOfDevice(const Napi::CallbackInfo& info);
Napi::Value getDeviceHandles(const Napi::CallbackInfo& info);

#endif