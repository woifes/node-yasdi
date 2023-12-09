{
    "targets": [{
        "target_name": "yasdi-bindings",
        "cflags!": [ "-fno-exceptions" ],
        "cflags_cc!": [ "-fno-exceptions" ],
        "sources": [
            "bin/yasdi-bindings/main.cpp",
            "bin/yasdi-bindings/sync/syncFunctionBindings.cpp"
        ],
        'include_dirs': [
            "<!@(node -p \"require('node-addon-api').include\")",
            "./bin/yasdi-1.8.1build9-src/include/",
            "./bin/yasdi-1.8.1build9-src/libs/",
            "./bin/yasdi-1.8.1build9-src/smalib/",
            "./bin/yasdi-bindings/async/",
            "./bin/yasdi-bindings/sync/"
        ],
        "defines": [],
        'conditions': [
            ['OS=="win"', {
                'defines': [
                    "_ALLOW_KEYWORD_MACROS",
                    "WINDOWS"
                ]
            }],
            ['OS=="linux"', {
                'libraries': [
                    "-Wl,-rpath,'$$ORIGIN'"
                ]
            }]
        ],
        'dependencies': [
            "<!(node -p \"require('node-addon-api').gyp\")",
            "yasdimaster"
        ],
        'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    },
    {
        "target_name": "yasdi",
        "type": "<(library)",
        "cflags!": [ "-fno-exceptions" ],
        "cflags_cc!": [ "-fno-exceptions" ],
        "sources": [
            "./bin/yasdi-1.8.1build9-src/smalib/getini.c",
            "./bin/yasdi-1.8.1build9-src/libs/libyasdi.c",
            "./bin/yasdi-1.8.1build9-src/libs/libyasdi.h",
            "./bin/yasdi-1.8.1build9-src/core/driver_layer.c",
            "./bin/yasdi-1.8.1build9-src/core/byteorder.c",
            "./bin/yasdi-1.8.1build9-src/core/netpacket.c",
            "./bin/yasdi-1.8.1build9-src/core/prot_layer.c",
            "./bin/yasdi-1.8.1build9-src/core/smadata_layer.c",
            "./bin/yasdi-1.8.1build9-src/core/scheduler.c",
            "./bin/yasdi-1.8.1build9-src/core/defractionizer.c",
            "./bin/yasdi-1.8.1build9-src/core/router.c",
            "./bin/yasdi-1.8.1build9-src/core/timer.c",
            "./bin/yasdi-1.8.1build9-src/core/tools.c",
            "./bin/yasdi-1.8.1build9-src/core/repository.c",
            "./bin/yasdi-1.8.1build9-src/core/fractionizer.c",
            "./bin/yasdi-1.8.1build9-src/core/statistic_writer.c",
            "./bin/yasdi-1.8.1build9-src/core/minqueue.c",
            "./bin/yasdi-1.8.1build9-src/core/minmap.c",
            "./bin/yasdi-1.8.1build9-src/core/mempool.c",
            "./bin/yasdi-1.8.1build9-src/core/iorequest.c",
            "./bin/yasdi-1.8.1build9-src/protocol/sunnynet.c",
            "./bin/yasdi-1.8.1build9-src/protocol/smanet.c",
            "./bin/yasdi-1.8.1build9-src/smalib/smadef.h",
            "./bin/yasdi-1.8.1build9-src/include/os.h"
        ],
        'include_dirs': [
            "./bin/yasdi-1.8.1build9-src/include/",
            "./bin/yasdi-1.8.1build9-src/libs/",
            "./bin/yasdi-1.8.1build9-src/smalib/",
            "./bin/yasdi-1.8.1build9-src/os/",
            "./bin/yasdi-1.8.1build9-src/core/",
            "./bin/yasdi-1.8.1build9-src/protocol/",
            "./bin/yasdi-1.8.1build9-src/master/",
            "./bin/yasdi-1.8.1build9-src/projects/generic-cmake/incprj/"
        ],
        'conditions': [
            ['OS=="linux"', {
                'sources': [
                    "./bin/yasdi-1.8.1build9-src/os/os_linux.c"
                    ],
                'ldflags': [
                    "-dl",
                    "-pthread"
                ]
            }],
            ['OS=="win"', {
                'sources': [
                    "./bin/yasdi-1.8.1build9-src/os/os_windows.c"
                ]
            }]
        ],
        'dependencies': [],
        'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    },
    {
        "target_name": "yasdimaster",
        "type": "<(library)",
        "cflags!": [ "-fno-exceptions" ],
        "cflags_cc!": [ "-fno-exceptions" ],
        "sources": [
            "./bin/yasdi-1.8.1build9-src/libs/libyasdimaster.c",
            "./bin/yasdi-1.8.1build9-src/libs/libyasdimaster.h",
            "./bin/yasdi-1.8.1build9-src/master/main.c",
            "./bin/yasdi-1.8.1build9-src/master/objman.c",
            "./bin/yasdi-1.8.1build9-src/master/netdevice.c",
            "./bin/yasdi-1.8.1build9-src/master/plant.c",
            "./bin/yasdi-1.8.1build9-src/master/netchannel.c",
            "./bin/yasdi-1.8.1build9-src/master/stateconfig.c",
            "./bin/yasdi-1.8.1build9-src/master/chanvalrepo.c",
            "./bin/yasdi-1.8.1build9-src/master/ysecurity.c",
            "./bin/yasdi-1.8.1build9-src/master/busevents.c",
            "./bin/yasdi-1.8.1build9-src/master/statereadchan.c",
            "./bin/yasdi-1.8.1build9-src/master/statewritechan.c",
            "./bin/yasdi-1.8.1build9-src/master/stateident.c",
            "./bin/yasdi-1.8.1build9-src/master/statedetection.c",
            "./bin/yasdi-1.8.1build9-src/master/mastercmd.c"
        ],
        'include_dirs': [
            "./bin/yasdi-1.8.1build9-src/include/",
            "./bin/yasdi-1.8.1build9-src/libs/",
            "./bin/yasdi-1.8.1build9-src/smalib/",
            "./bin/yasdi-1.8.1build9-src/os/",
            "./bin/yasdi-1.8.1build9-src/core/",
            "./bin/yasdi-1.8.1build9-src/protocol/",
            "./bin/yasdi-1.8.1build9-src/master/",
            "./bin/yasdi-1.8.1build9-src/projects/generic-cmake/incprj/"
        ],
        'conditions': [
            ['OS=="linux"', {
                'sources': [
                    "./bin/yasdi-1.8.1build9-src/os/os_linux.c"
                    ],
                'link_settings': {
                    'libraries': [
                        "-dl",
                        "-pthread"
                    ]
                },
                'libraries': [
                    "-Wl,-rpath,'$$ORIGIN'"
                ]
            }],
            ['OS=="win"', {
                'sources': [
                    "./bin/yasdi-1.8.1build9-src/os/os_windows.c"
                ]
            }]
        ],
        'dependencies': [
            "yasdi",
            "libyasdi_drv_serial"
        ],
        'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    },
    {
        "target_name": "libyasdi_drv_serial",
        "type": "<(library)",
        "cflags!": [ "-fno-exceptions" ],
        "cflags_cc!": [ "-fno-exceptions" ],
        "sources": [
        ],
        'include_dirs': [
            "./bin/yasdi-1.8.1build9-src/include/",
            "./bin/yasdi-1.8.1build9-src/libs/",
            "./bin/yasdi-1.8.1build9-src/smalib/",
            "./bin/yasdi-1.8.1build9-src/os/",
            "./bin/yasdi-1.8.1build9-src/core/",
            "./bin/yasdi-1.8.1build9-src/protocol/",
            "./bin/yasdi-1.8.1build9-src/master/",
            "./bin/yasdi-1.8.1build9-src/projects/generic-cmake/incprj/"
        ],
        'conditions': [
            ['OS=="linux"', {
                'sources': [
                    "./bin/yasdi-1.8.1build9-src/driver/serial_posix.c"
                    ],
                'libraries': [
                    "-Wl,-rpath,'$$ORIGIN'"
                ]
            }],
            ['OS=="win"', {
                'sources': [
                    "./bin/yasdi-1.8.1build9-src/driver/serial_windows.c"
                ]
            }]
        ],
        'dependencies': [
            "yasdi"
        ],
        'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]  
    },
    {
        'target_name': 'action_after_build',
        'type': 'none',
        'dependencies': [ "yasdi-bindings" ],
        'conditions': [
            ['OS=="linux"', {
                'actions': [{
                'action_name': "copylib",
                'inputs': [
                    '<@(PRODUCT_DIR)/yasdi_drv_serial.so'
                ],
                'outputs': [
                    "<@(PRODUCT_DIR)/libyasdi_drv_serial.so"
                ],
                'action': ['cp', "<@(PRODUCT_DIR)/yasdi_drv_serial.so", "<@(PRODUCT_DIR)/libyasdi_drv_serial.so"]
                }]
            }]
        ]
    }
    ]
}