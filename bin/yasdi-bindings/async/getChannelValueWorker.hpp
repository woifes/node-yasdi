// SPDX-FileCopyrightText: © 2022 woifes <https://github.com/woifes>
// SPDX-License-Identifier: MIT

#ifndef _GET_CHANNEL_VALUE_WORKER
#define _GET_CHANNEL_VALUE_WORKER
#ifdef WINDOWS
#include <windows.h>
#endif
#include "libyasdimaster.h"
#include "napi.h"
#include <iostream>

#define MAX_VAL_STATUS_TEXT_SIZE 50

class GetChannelValueWorker : public Napi::AsyncWorker {
    public:
        GetChannelValueWorker(Napi::Function fn, DWORD deviceHandle, DWORD channelHandle, DWORD maxAge)
            : Napi::AsyncWorker(fn), _devHandle(deviceHandle), _chanHandle(channelHandle), _maxAge(maxAge), _value(0.0), _timeStamp(0), _result(0) {

        }
        ~GetChannelValueWorker() {
            
        }

        void Execute() {
            _result = GetChannelValue(_chanHandle, _devHandle, &_value, &_statusText[0], MAX_VAL_STATUS_TEXT_SIZE, _maxAge);
            _timeStamp = GetChannelValueTimeStamp(_chanHandle, _devHandle);
        }

        void OnOK() {
            Napi::HandleScope scope(Env());
            Napi::Object obj = Napi::Object::New(Env());
            obj.Set("value", Napi::Number::New(Env(), _value));
            obj.Set("statusText", Napi::String::New(Env(), std::string(&_statusText[0])));
            obj.Set("result", Napi::Number::New(Env(), (double)_result));
            obj.Set("timeStamp", Napi::Number::New(Env(), (double)_timeStamp));
            Callback().Call({ obj });
        }
        
    private:
        DWORD _devHandle;
        DWORD _chanHandle;
        DWORD _maxAge;
        double _value;
        DWORD _timeStamp;
        char _statusText[MAX_VAL_STATUS_TEXT_SIZE];
        int _result;
};


#endif