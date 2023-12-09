# @woifes/node-yasdi

## Why?
This package binds the yasdi library to a nodeJS package which may be used for other projects. The yasdi library is a open source library provided by SMA, which enables the connection to SMA products. 
This package was only used for/used with:
* __Reading__ the data of inverters via __RS485__
* A cheap __USB-RS485__ converter via a raspberry pi

*On windows I only succeeded to compile the bindings but did not try it*

**Please check the source code before using this package**

## Installation
Package not (yet) published

## Quick start

### Using node-yasdi in your program

```typescript
import { NodeYasdi } from "@woifes/node-yasdi";

const nodeYasdi = new NodeYasdi("myPlant", { 
    expectedDeviceCount: 3,
    //serialPorts: ["path/to/serialDevice"] //on linux you can also use a link as a device like "/dev/serial/by-path/<usbDeviceLink>"
    //iniFileDir: "path/to/dir/where/iniFile/may/be/created
}, "path/to/iniFile.ini"); //either provide 'serial ports' and 'iniFileDir' in config, or the ini file directly
await once(nodeYasdi, "deviceSearchEnd"); //the yasdi library can not fetch data before this event

let inverter01 = nodeYasdi.getInverterBySerial(nodeYasdi.handles[0]);

let values = await inverter01.getData(5);
```
### Using node-yasdi shell

```shell
pnpm run createIni 2> my.ini #follow instructions to create a yasdi compatible ini file

pnpm run shell <path/to/my.ini> #run the shell with a given ini file
```

## Remarks regarding yasdi and its LGPL
*Here are the instructions how one can build a custom version of the yasdi library into this package (according to LGPL v2.1 with statically linked libraries). (It is assumed that the nodeJS related development is known.)*

First you need the TypeScript version of this package which is part of a [monorepo](https://github.com/woifes/node-monorepo). The following describes where you find the different parts involved in the build:

* The yasdi source code lies in the [bin](./bin/yasdi-1.8.1build9-src/) folder
* The bindings (glue code) also lies in the [bin](./bin/yasdi-bindings/) folder \
 *This file was created by investigating the [cmakefile](./bin/yasdi-1.8.1build9-src/projects/generic-cmake/CMakeLists.txt) delivered with yasdi, some time and trial and error*
* The build is configured via the [bindings.gyp](binding.gyp) file
* Additionally there is an interface of the bindings for TypeScript defined in [src](./src/bindings/yasdiBindings.ts)

### Changes made to yasdi
* in `bin/yasdi-1.8.1build9-src/os/os_linux.h`: changed include from `#include <termio.h>` to `#include <termios.h>` so that it compiles on alpine linux

For running the build see the following section.

## Running the build

The project is part of a monorepo. If the project is checked out in this environment use the following scripts:

Build yasdi library and bindings:

```shell
pnpm run build
```

TypeScript build:

```shell
pnpm run compile
```

Run tests:

```shell
pnpm test
```