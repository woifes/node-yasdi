// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

#ifdef WINDOWS
#include <windows.h>
#endif

#include "syncFunctionBindings.hpp"
#include "napi.h"
#include "libyasdimaster.h"

/*
* internal function to get device channels
*/
Napi::Object getChannelsOfDevice(const Napi::CallbackInfo& info) {

    Napi::Env env = info.Env();
    if(info.Length() < 1) {
        Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    }
    if(!info[0].IsNumber()) {
        Napi::Error::New(env, "Handle has to be a number").ThrowAsJavaScriptException();
    }
    DWORD handle = info[0].As<Napi::Number>().Int32Value();

    DWORD chanHandles[300];
    DWORD chanNum = GetChannelHandlesEx(handle, chanHandles, 300, SPOTCHANNELS);
    Napi::Object channelsObj = Napi::Object::New(env);

    if(chanNum != 0) {
        for(DWORD i = 0; i < chanNum; i++) {
            DWORD ch = chanHandles[i];
            char chanName[50];
            char chanUnit[17];

            GetChannelUnit(ch, chanUnit, sizeof(chanUnit)-1);
            GetChannelName(ch, chanName, sizeof(chanName)-1);

            Napi::Object chanObj = Napi::Object::New(env);
            chanObj.Set("handle", Napi::Number::New(env, ch));
            chanObj.Set("unit", Napi::String::New(env, std::string(chanUnit)));
            channelsObj.Set(std::string(chanName), chanObj);
        }
    }
    Napi::Object resultObj = Napi::Object::New(env);
    resultObj.Set("channels", channelsObj);
    resultObj.Set("channelCount", Napi::Number::New(env, chanNum));
    return resultObj;
}

Napi::Value getSerialOfDevice(const Napi::CallbackInfo& info) {
    
    Napi::Env env = info.Env();
    if(info.Length() < 1) {
        Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    }
    if(!info[0].IsNumber()) {
        Napi::Error::New(env, "Handle has to be a number").ThrowAsJavaScriptException();
    }
    DWORD handle = info[0].As<Napi::Number>().Int32Value();
    DWORD serial;
    int iRes = GetDeviceSN(handle, &serial);
    if(iRes != 0) {
        std::string errStr = "Error when getting device: ";
        errStr += iRes;
        Napi::Error err = Napi::Error::New(env, errStr.c_str());
        err.ThrowAsJavaScriptException();
    }
    return Napi::Number::New(env, (double)serial);
}

Napi::Value getNameOfDevice(const Napi::CallbackInfo& info) {
    
    Napi::Env env = info.Env();
    if(info.Length() < 1) {
        Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    }
    if(!info[0].IsNumber()) {
        Napi::Error::New(env, "Handle has to be a number").ThrowAsJavaScriptException();
    }
    DWORD handle = info[0].As<Napi::Number>().Int32Value();
    char name[30];
    int iRes = GetDeviceName(handle, name, 29);
    if(iRes == 0) {
        return Napi::String::New(env, std::string(name));
    } else {
        return Napi::String::New(env, "");
    }
}

Napi::Value getTypeOfDevice(const Napi::CallbackInfo& info) {
    
    Napi::Env env = info.Env();
    if(info.Length() < 1) {
        Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    }
    if(!info[0].IsNumber()) {
        Napi::Error::New(env, "Handle has to be a number").ThrowAsJavaScriptException();
    }
    DWORD handle = info[0].As<Napi::Number>().Int32Value();
    char deviceType[30];
    int iRes = GetDeviceType(handle, deviceType, 29);
    if(iRes == 0) {
        return Napi::String::New(env, std::string(deviceType));
    } else {
        return Napi::String::New(env, "");
    }
}

Napi::Value getDeviceHandles(const Napi::CallbackInfo& info) {
    
    Napi::Env env = info.Env();
    DWORD handles[100];

    int iRes = GetDeviceHandles(&handles[0], (DWORD)100);
    Napi::Array resultArr = Napi::Array::New(env, iRes);
    for(int i = 0; i < iRes; i++) {
        resultArr[i] = Napi::Number::New(env, handles[i]);
    }
    return resultArr;
}