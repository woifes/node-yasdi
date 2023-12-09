// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

#ifdef WINDOWS
#include <windows.h>
#endif
#include "libyasdimaster.h"
#include "napi.h"
#include "initYasdiWorker.hpp"
#include "getChannelValueWorker.hpp"
#include "syncFunctionBindings.hpp"

#include <iostream>
#include <vector>
#include <mutex>

using namespace Napi;

struct DeviceDetectionData {
    TYASDIDetectionSub subEvent;
    DWORD deviceHandle;
    DWORD miscParam;
};

struct NewValueData {
    DWORD dChannelHandle;
    DWORD dDeviceHandle;
    double dValue;
    char* textvalue;
    int errorcode;
};

using Context = Reference<Value>;
void DeviceDetectionToJS(Napi::Env env, Napi::Function callback, Context *context, DeviceDetectionData *data);
void NewValueToJS(Napi::Env env, Napi::Function callback, Context *context, NewValueData *data);
using DeviceDetectTSFN = Napi::TypedThreadSafeFunction<Context, DeviceDetectionData, DeviceDetectionToJS>;
using NewValueTSFN = Napi::TypedThreadSafeFunction<Context, NewValueData, NewValueToJS>;
using FinalizerDataType = void;

DeviceDetectTSFN deviceDetectEventTsfn;
NewValueTSFN newValueEventTsfn;

/**
* internal event listener which updates the list of found devices which nodejs can poll
*/
void deviceDetectEventListener(TYASDIDetectionSub subEvent, DWORD deviceHandle, DWORD miscParam) {
    DeviceDetectionData* data = new DeviceDetectionData();
    data->subEvent = subEvent;
    data->deviceHandle = deviceHandle;
    data->miscParam = miscParam;
    deviceDetectEventTsfn.NonBlockingCall(data);
}

void DeviceDetectionToJS(Napi::Env env, Napi::Function callback, Context *context, DeviceDetectionData *data) {
    if(env != nullptr) {
        Object result = Object::New(env);
        String subEvent;
        switch(data->subEvent) {
            case YASDI_EVENT_DEVICE_ADDED:
                subEvent = String::New(env, "add");
            break;
            case YASDI_EVENT_DEVICE_REMOVED:
                subEvent = String::New(env, "remove");
            break;
            case YASDI_EVENT_DEVICE_SEARCH_END:
                subEvent = String::New(env, "searchEnd");
            break;
            case YASDI_EVENT_DOWNLOAD_CHANLIST:
                subEvent = String::New(env, "downloadChannels");
            break;
        }
        result.Set("event", subEvent);
        result.Set("handle", Number::New(env, data->deviceHandle));
        result.Set("miscParam", Number::New(env, data->miscParam));
        if(callback != nullptr) {
            callback.Call(context->Value(), { result });
        }
    }
    if(data != nullptr) {
        delete data;
    }
}

void newChannelValueEventListener(DWORD dChannelHandle, DWORD dDeviceHandle, double dValue, char* textvalue, int errorcode) {
    NewValueData* data = new NewValueData();
    data->dChannelHandle = dChannelHandle;
    data->dDeviceHandle = dDeviceHandle;
    data->dValue = dValue;
    data->textvalue = textvalue;
    data->errorcode = errorcode;
    newValueEventTsfn.NonBlockingCall(data);
}

void NewValueToJS(Napi::Env env, Napi::Function callback, Context *context, NewValueData *data) {
    if(env != nullptr) {
        Object result = Object::New(env);
        result.Set("dChannelHandle", Number::New(env, data->dChannelHandle));
        result.Set("dDeviceHandle", Number::New(env, data->dDeviceHandle));
        result.Set("dValue", Number::New(env, data->dValue));
        result.Set("textvalue", String::New(env, std::string(data->textvalue)));
        result.Set("errorcode", Number::New(env, data->errorcode));
        if(callback != nullptr) {
            callback.Call(context->Value(), { result });
        }
    }
    if(data != nullptr) {
        delete data;
    }
}

/**
* Function to call from nodejs to init yasdi
*/
Value InitYasdi(const CallbackInfo& info) {
    Env env = info.Env();
    if(info.Length() != 4) {
        Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    if(!info[0].IsString() || !info[1].IsFunction()|| !info[2].IsFunction()|| !info[3].IsFunction()) {
        TypeError::New(env, "Wrong type of Arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string path = info[0].As<String>();
    Function deviceDetectCb = info[1].As<Function>();
    Function newValueCb = info[2].As<Function>();
    Function finishCb = info[3].As<Function>();
    Context *context = new Reference<Value>(Persistent(info.This()));

    deviceDetectEventTsfn = DeviceDetectTSFN::New(
        env,
        deviceDetectCb,
        "Device detect callback",
        0,
        1,
        context
    );
    newValueEventTsfn = NewValueTSFN::New(
        env,
        deviceDetectCb,
        "New value callback",
        0,
        1,
        context
    );

    InitYasdiWorker* wk = new InitYasdiWorker(finishCb, path, (void*)&deviceDetectEventListener, (void*)&newChannelValueEventListener);
    wk->Queue();
    return env.Undefined();
}

/**
* Function to start async device search from nodejs
*/
Value searchDevicesAsync(const CallbackInfo& info) {
    Env env = info.Env();
    if(info.Length() < 1) {
        Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    if(!info[0].IsNumber()) {
        TypeError::New(env, "Handle has to be a number").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    int expNum = info[0].As<Number>().Int32Value();

    int iRes = DoStartDeviceDetection(expNum, false);

    return Number::New(env, iRes);
}

/**
* Function to get a certain value from a device from nodejs
*/
Value getChannelValue(const CallbackInfo& info) {
    Env env = info.Env();
    if(info.Length() != 4) {
        Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    if(!info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber() || !info[3].IsFunction()) {
        TypeError::New(env, "Wrong type of Arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    DWORD devHandle = info[0].As<Number>().Uint32Value();
    DWORD chanHandle = info[1].As<Number>().Uint32Value();
    DWORD maxAge = info[2].As<Number>().Uint32Value();
    Function cb = info[3].As<Function>();
    
    GetChannelValueWorker* wk = new GetChannelValueWorker(cb, devHandle, chanHandle, maxAge);
    wk->Queue();
    return env.Undefined();
}

Object Init(Env env, Object exports) {
    exports.Set("Init", Function::New(env, InitYasdi));
    exports.Set("SearchDevicesAsync", Function::New(env, searchDevicesAsync));
    exports.Set("GetChannelValue", Function::New(env, getChannelValue));

    exports.Set("GetChannelsOfDevice", Function::New(env, getChannelsOfDevice));
    exports.Set("GetSerialOfDevice", Function::New(env, getSerialOfDevice));
    exports.Set("GetNameOfDevice", Function::New(env, getNameOfDevice));
    exports.Set("GetTypeOfDevice", Function::New(env, getTypeOfDevice));
    exports.Set("GetDeviceHandles", Function::New(env, getDeviceHandles));

    return exports;
}

NODE_API_MODULE(yasdiBindings, Init)