// PiexifJS Wrapper for TypeScript
// Original code from piexifjs (MIT License)

export const piexif = (function () {
    "use strict";
    var that: any = {};
    that.version = "1.0.4";

    that.remove = function (jpeg: string) {
        var b64 = false;
        if (jpeg.slice(0, 2) == "\xff\xd8") {
        } else if (jpeg.slice(0, 23) == "data:image/jpeg;base64," || jpeg.slice(0, 22) == "data:image/jpg;base64,") {
            jpeg = atob(jpeg.split(",")[1]);
            b64 = true;
        } else {
            throw new Error("Given data is not jpeg.");
        }

        var segments = splitIntoSegments(jpeg);
        var newSegments = segments.filter(function (seg) {
            return !(seg.slice(0, 2) == "\xff\xe1" &&
                seg.slice(4, 10) == "Exif\x00\x00");
        });

        var new_data = newSegments.join("");
        if (b64) {
            new_data = "data:image/jpeg;base64," + btoa(new_data);
        }

        return new_data;
    };


    that.insert = function (exif: string, jpeg: string) {
        var b64 = false;
        if (exif.slice(0, 6) != "\x45\x78\x69\x66\x00\x00") {
            throw new Error("Given data is not exif.");
        }
        if (jpeg.slice(0, 2) == "\xff\xd8") {
        } else if (jpeg.slice(0, 23) == "data:image/jpeg;base64," || jpeg.slice(0, 22) == "data:image/jpg;base64,") {
            jpeg = atob(jpeg.split(",")[1]);
            b64 = true;
        } else {
            throw new Error("Given data is not jpeg."); // Silent fail preferrable in prod?
        }

        var exifStr = "\xff\xe1" + pack(">H", [exif.length + 2]) + exif;
        var segments = splitIntoSegments(jpeg);
        var new_data = mergeSegments(segments, exifStr);
        if (b64) {
            new_data = "data:image/jpeg;base64," + btoa(new_data);
        }

        return new_data;
    };


    that.load = function (data: string) {
        var input_data;
        if (typeof (data) == "string") {
            if (data.slice(0, 2) == "\xff\xd8") {
                input_data = data;
            } else if (data.slice(0, 23) == "data:image/jpeg;base64," || data.slice(0, 22) == "data:image/jpg;base64,") {
                input_data = atob(data.split(",")[1]);
            } else if (data.slice(0, 4) == "Exif") {
                input_data = data.slice(6);
            } else {
                // throw new Error("'load' gots invalid file data."); 
                return null; // Graceful fail
            }
        } else {
            // throw new Error("'load' gots invalid type argument.");
            return null;
        }

        var exif_dict: any = {
            "0th": {},
            "Exif": {},
            "GPS": {},
            "Interop": {},
            "1st": {},
            "thumbnail": null
        };
        try {
            var exifReader = new ExifReader(input_data);
            if (exifReader.tiftag === null) {
                return exif_dict;
            }

            if (exifReader.tiftag.slice(0, 2) == "\x49\x49") {
                exifReader.endian_mark = "<";
            } else {
                exifReader.endian_mark = ">";
            }

            var pointer = unpack(exifReader.endian_mark + "L",
                exifReader.tiftag.slice(4, 8))[0];
            exif_dict["0th"] = exifReader.get_ifd(pointer, "0th");

            var first_ifd_pointer = exif_dict["0th"]["first_ifd_pointer"];
            delete exif_dict["0th"]["first_ifd_pointer"];

            if (34665 in exif_dict["0th"]) {
                pointer = exif_dict["0th"][34665];
                exif_dict["Exif"] = exifReader.get_ifd(pointer, "Exif");
            }
            if (34853 in exif_dict["0th"]) {
                pointer = exif_dict["0th"][34853];
                exif_dict["GPS"] = exifReader.get_ifd(pointer, "GPS");
            }
            if (40965 in exif_dict["Exif"]) {
                pointer = exif_dict["Exif"][40965];
                exif_dict["Interop"] = exifReader.get_ifd(pointer, "Interop");
            }
            if (first_ifd_pointer != "\x00\x00\x00\x00") {
                pointer = unpack(exifReader.endian_mark + "L",
                    first_ifd_pointer)[0];
                exif_dict["1st"] = exifReader.get_ifd(pointer, "1st");
                if ((513 in exif_dict["1st"]) && (514 in exif_dict["1st"])) {
                    var end = exif_dict["1st"][513] + exif_dict["1st"][514];
                    var thumb = exifReader.tiftag.slice(exif_dict["1st"][513], end);
                    exif_dict["thumbnail"] = thumb;
                }
            }
        } catch (e) { /* console.warn("Exif read error", e); */ return null; }

        return exif_dict;
    };


    that.dump = function (exif_dict_original: any) {
        var TIFF_HEADER_LENGTH = 8;

        var exif_dict = JSON.parse(JSON.stringify(exif_dict_original));
        var header = "Exif\x00\x00\x4d\x4d\x00\x2a\x00\x00\x00\x08";
        var exif_is = false;
        var gps_is = false;
        var interop_is = false;
        var first_is = false;

        var zeroth_ifd,
            exif_ifd,
            interop_ifd,
            gps_ifd,
            first_ifd;

        if ("0th" in exif_dict) {
            zeroth_ifd = exif_dict["0th"];
        } else {
            zeroth_ifd = {};
        }

        if ((("Exif" in exif_dict) && (Object.keys(exif_dict["Exif"]).length)) ||
            (("Interop" in exif_dict) && (Object.keys(exif_dict["Interop"]).length))) {
            zeroth_ifd[34665] = 1;
            exif_is = true;
            exif_ifd = exif_dict["Exif"];
            if (("Interop" in exif_dict) && Object.keys(exif_dict["Interop"]).length) {
                exif_ifd[40965] = 1;
                interop_is = true;
                interop_ifd = exif_dict["Interop"];
            } else if (Object.keys(exif_ifd).indexOf(that.ExifIFD.InteroperabilityTag.toString()) > -1) {
                delete exif_ifd[40965];
            }
        } else if (Object.keys(zeroth_ifd).indexOf(that.ImageIFD.ExifTag.toString()) > -1) {
            delete zeroth_ifd[34665];
        }

        if (("GPS" in exif_dict) && (Object.keys(exif_dict["GPS"]).length)) {
            zeroth_ifd[that.ImageIFD.GPSTag] = 1;
            gps_is = true;
            gps_ifd = exif_dict["GPS"];
        } else if (Object.keys(zeroth_ifd).indexOf(that.ImageIFD.GPSTag.toString()) > -1) {
            delete zeroth_ifd[that.ImageIFD.GPSTag];
        }

        if (("1st" in exif_dict) &&
            ("thumbnail" in exif_dict) &&
            (exif_dict["thumbnail"] != null)) {
            first_is = true;
            exif_dict["1st"][513] = 1;
            exif_dict["1st"][514] = 1;
            first_ifd = exif_dict["1st"];
        }

        var zeroth_set = _dict_to_bytes(zeroth_ifd, "0th", 0);
        var zeroth_length = (zeroth_set[0].length + Number(exif_is) * 12 + Number(gps_is) * 12 + 4 +
            zeroth_set[1].length);

        var exif_set,
            exif_bytes = "",
            exif_length = 0,
            gps_set,
            gps_bytes = "",
            gps_length = 0,
            interop_set,
            interop_bytes = "",
            interop_length = 0,
            first_set,
            first_bytes = "",
            thumbnail;
        if (exif_is) {
            exif_set = _dict_to_bytes(exif_ifd, "Exif", zeroth_length);
            exif_length = exif_set[0].length + Number(interop_is) * 12 + exif_set[1].length;
        }
        if (gps_is) {
            gps_set = _dict_to_bytes(gps_ifd, "GPS", zeroth_length + exif_length);
            gps_bytes = gps_set.join("");
            gps_length = gps_bytes.length;
        }
        if (interop_is) {
            var offset = zeroth_length + exif_length + gps_length;
            interop_set = _dict_to_bytes(interop_ifd, "Interop", offset);
            interop_bytes = interop_set.join("");
            interop_length = interop_bytes.length;
        }
        if (first_is) {
            var offset = zeroth_length + exif_length + gps_length + interop_length;
            first_set = _dict_to_bytes(first_ifd, "1st", offset);
            thumbnail = _get_thumbnail(exif_dict["thumbnail"]);
            if (thumbnail.length > 64000) {
                // throw new Error("Given thumbnail is too large. max 64kB");
                console.warn("Thumnail too large, skipping");
                return null;
            }
        }

        var exif_pointer = "",
            gps_pointer = "",
            interop_pointer = "",
            first_ifd_pointer = "\x00\x00\x00\x00";
        if (exif_is) {
            var pointer_value = TIFF_HEADER_LENGTH + zeroth_length;
            var pointer_str = pack(">L", [pointer_value]);
            var key: any = 34665;
            var key_str = pack(">H", [key]);
            var type_str = pack(">H", [TYPES["Long"]]);
            var length_str = pack(">L", [1]);
            exif_pointer = key_str + type_str + length_str + pointer_str;
        }
        if (gps_is) {
            var pointer_value = TIFF_HEADER_LENGTH + zeroth_length + exif_length;
            var pointer_str = pack(">L", [pointer_value]);
            var key: any = 34853;
            var key_str = pack(">H", [key]);
            var type_str = pack(">H", [TYPES["Long"]]);
            var length_str = pack(">L", [1]);
            gps_pointer = key_str + type_str + length_str + pointer_str;
        }
        if (interop_is) {
            var pointer_value = (TIFF_HEADER_LENGTH +
                zeroth_length + exif_length + gps_length);
            var pointer_str = pack(">L", [pointer_value]);
            var key: any = 40965;
            var key_str = pack(">H", [key]);
            var type_str = pack(">H", [TYPES["Long"]]);
            var length_str = pack(">L", [1]);
            interop_pointer = key_str + type_str + length_str + pointer_str;
        }
        if (first_is) {
            var pointer_value = (TIFF_HEADER_LENGTH + zeroth_length +
                exif_length + gps_length + interop_length);
            first_ifd_pointer = pack(">L", [pointer_value]);
            var thumbnail_pointer = (pointer_value + first_set[0].length + 24 +
                4 + first_set[1].length);
            var thumbnail_p_bytes = ("\x02\x01\x00\x04\x00\x00\x00\x01" +
                pack(">L", [thumbnail_pointer]));
            var thumbnail_length_bytes = ("\x02\x02\x00\x04\x00\x00\x00\x01" +
                pack(">L", [thumbnail.length]));
            first_bytes = (first_set[0] + thumbnail_p_bytes +
                thumbnail_length_bytes + "\x00\x00\x00\x00" +
                first_set[1] + thumbnail);
        }

        var zeroth_bytes = (zeroth_set[0] + exif_pointer + gps_pointer +
            first_ifd_pointer + zeroth_set[1]);
        if (exif_is) {
            exif_bytes = exif_set[0] + interop_pointer + exif_set[1];
        }

        return (header + zeroth_bytes + exif_bytes + gps_bytes +
            interop_bytes + first_bytes);
    };


    that.ImageIFD = {
        ProcessingSoftware: 11,
        NewSubfileType: 254,
        SubfileType: 255,
        ImageWidth: 256,
        ImageLength: 257,
        BitsPerSample: 258,
        Compression: 259,
        PhotometricInterpretation: 262,
        Threshholding: 263,
        CellWidth: 264,
        CellLength: 265,
        FillOrder: 266,
        DocumentName: 269,
        ImageDescription: 270,
        Make: 271,
        Model: 272,
        StripOffsets: 273,
        Orientation: 274,
        SamplesPerPixel: 277,
        RowsPerStrip: 278,
        StripByteCounts: 279,
        XResolution: 282,
        YResolution: 283,
        PlanarConfiguration: 284,
        GrayResponseUnit: 290,
        GrayResponseCurve: 291,
        T4Options: 292,
        T6Options: 293,
        ResolutionUnit: 296,
        TransferFunction: 301,
        Software: 305,
        DateTime: 306,
        Artist: 315,
        HostComputer: 316,
        Predictor: 317,
        WhitePoint: 318,
        PrimaryChromaticities: 319,
        ColorMap: 320,
        HalftoneHints: 321,
        TileWidth: 322,
        TileLength: 323,
        TileOffsets: 324,
        TileByteCounts: 325,
        SubIFDs: 330,
        InkSet: 332,
        InkNames: 333,
        NumberOfInks: 334,
        DotRange: 336,
        TargetPrinter: 337,
        ExtraSamples: 338,
        SampleFormat: 339,
        SMinSampleValue: 340,
        SMaxSampleValue: 341,
        TransferRange: 342,
        JPEGProc: 512,
        JPEGInterchangeFormat: 513,
        JPEGInterchangeFormatLength: 514,
        JPEGRestartInterval: 515,
        JPEGLosslessPredictors: 517,
        JPEGPointTransforms: 518,
        JPEGQTables: 519,
        JPEGDCTables: 520,
        JPEGACTables: 521,
        YCbCrCoefficients: 529,
        YCbCrSubSampling: 530,
        YCbCrPositioning: 531,
        ReferenceBlackWhite: 532,
        Copyright: 33432,
        ExifTag: 34665,
        GPSTag: 34853,
    };

    that.ExifIFD = {
        ExposureTime: 33434,
        FNumber: 33437,
        ExposureProgram: 34850,
        SpectralSensitivity: 34852,
        ISOSpeedRatings: 34855,
        OECF: 34856,
        SensitivityType: 34864,
        StandardOutputSensitivity: 34865,
        RecommendedExposureIndex: 34866,
        ISOSpeed: 34867,
        ISOSpeedLatitudeyyy: 34868,
        ISOSpeedLatitudezzz: 34869,
        ExifVersion: 36864,
        DateTimeOriginal: 36867,
        DateTimeDigitized: 36868,
        ComponentsConfiguration: 37121,
        CompressedBitsPerPixel: 37122,
        ShutterSpeedValue: 37377,
        ApertureValue: 37378,
        BrightnessValue: 37379,
        ExposureBiasValue: 37380,
        MaxApertureValue: 37381,
        SubjectDistance: 37382,
        MeteringMode: 37383,
        LightSource: 37384,
        Flash: 37385,
        FocalLength: 37386,
        SubjectArea: 37396,
        MakerNote: 37500,
        UserComment: 37510,
        SubSecTime: 37520,
        SubSecTimeOriginal: 37521,
        SubSecTimeDigitized: 37522,
        FlashpixVersion: 40960,
        ColorSpace: 40961,
        PixelXDimension: 40962,
        PixelYDimension: 40963,
        RelatedSoundFile: 40964,
        InteroperabilityTag: 40965,
        FlashEnergy: 41483,
        SpatialFrequencyResponse: 41484,
        FocalPlaneXResolution: 41486,
        FocalPlaneYResolution: 41487,
        FocalPlaneResolutionUnit: 41488,
        SubjectLocation: 41492,
        ExposureIndex: 41493,
        SensingMethod: 41495,
        FileSource: 41728,
        SceneType: 41729,
        CFAPattern: 41730,
        CustomRendered: 41985,
        ExposureMode: 41986,
        WhiteBalance: 41987,
        DigitalZoomRatio: 41988,
        FocalLengthIn35mmFilm: 41989,
        SceneCaptureType: 41990,
        GainControl: 41991,
        Contrast: 41992,
        Saturation: 41993,
        Sharpness: 41994,
        DeviceSettingDescription: 41995,
        SubjectDistanceRange: 41996,
        ImageUniqueID: 42016,
        CameraOwnerName: 42032,
        BodySerialNumber: 42033,
        LensSpecification: 42034,
        LensMake: 42035,
        LensModel: 42036,
        LensSerialNumber: 42037,
        Gamma: 42240,
    };

    that.GPSIFD = {
        GPSVersionID: 0,
        GPSLatitudeRef: 1,
        GPSLatitude: 2,
        GPSLongitudeRef: 3,
        GPSLongitude: 4,
        GPSAltitudeRef: 5,
        GPSAltitude: 6,
        GPSTimeStamp: 7,
        GPSSatellites: 8,
        GPSStatus: 9,
        GPSMeasureMode: 10,
        GPSDOP: 11,
        GPSSpeedRef: 12,
        GPSSpeed: 13,
        GPSTrackRef: 14,
        GPSTrack: 15,
        GPSImgDirectionRef: 16,
        GPSImgDirection: 17,
        GPSMapDatum: 18,
        GPSDestLatitudeRef: 19,
        GPSDestLatitude: 20,
        GPSDestLongitudeRef: 21,
        GPSDestLongitude: 22,
        GPSDestBearingRef: 23,
        GPSDestBearing: 24,
        GPSDestDistanceRef: 25,
        GPSDestDistance: 26,
        GPSProcessingMethod: 27,
        GPSAreaInformation: 28,
        GPSDateStamp: 29,
        GPSDifferential: 30,
        GPSHPositioningError: 31,
    };

    that.InteropIFD = {
        InteroperabilityIndex: 1,
    };

    that.TAGS = {};
    that.TAGS["Image"] = that.ImageIFD;
    that.TAGS["Exif"] = that.ExifIFD;
    that.TAGS["GPS"] = that.GPSIFD;
    that.TAGS["Interop"] = that.InteropIFD;


    var TAGS = that.TAGS;

    var TYPES: any = {
        "Byte": 1,
        "Ascii": 2,
        "Short": 3,
        "Long": 4,
        "Rational": 5,
        "Undefined": 7,
        "SLong": 9,
        "SRational": 10
    };

    function startWith(body: string, head: string) {
        return body.slice(0, head.length) == head;
    }


    function splitIntoSegments(data: string) {
        if (data.slice(0, 2) != "\xff\xd8") {
            throw new Error("Given data is not jpeg.");
        }

        var segments = [];
        var new_segments = [];
        var length_bytes = data.slice(2, 4);
        var length = length_bytes.charCodeAt(0) * 256 + length_bytes.charCodeAt(1);
        segments.push(data.slice(0, 2));
        segments.push(data.slice(2, 2 + length));
        var data2 = data.slice(2 + length);
        var pos = 0;
        var rcv_byte = 0;
        var segment_type_byte = 0;
        var segment_types = [];
        var seg_p = 0;
        while (1) {
            if ((data2.charCodeAt(pos) == 0xff) && (data2.charCodeAt(pos + 1) != 0)) {
                if (rcv_byte) {
                    new_segments.push(data2.slice(seg_p, pos));
                }
                segment_types.push(data2.charCodeAt(pos + 1));

                if (data2.charCodeAt(pos + 1) == 0xd9) { // EOI
                    new_segments.push(data2.slice(pos, pos + 2));
                    break;
                }

                seg_p = pos;
                rcv_byte = 1;
            } else {
                rcv_byte = 0;
            }
            pos += 1;
        }

        for (var x = 0; x < new_segments.length; x++) {
            // 0xda: SOS. This segment has no length info.
            // But it is the last segment before EOI(0xd9).
            if (segment_types[x] == 0xda) {
                segments.push(new_segments[x] + new_segments[x + 1]);
                break;
            } else {
                length_bytes = new_segments[x].slice(2, 4);
                length = length_bytes.charCodeAt(0) * 256 + length_bytes.charCodeAt(1);
                segments.push(new_segments[x].slice(0, 2 + length));
            }
        }

        return segments;
    }


    function getExifSeg(segments: any[]) {
        var seg,
            i = 0;
        while (i < segments.length) {
            seg = segments[i];
            if (seg.slice(0, 2) == "\xff\xe1" &&
                seg.slice(4, 10) == "Exif\x00\x00") {
                return seg;
            }
            i++;
        }
        return null;
    }


    function mergeSegments(segments: any[], exif: any) {
        var newSegments = segments.filter(function (seg) {
            return !(seg.slice(0, 2) == "\xff\xe1" &&
                seg.slice(4, 10) == "Exif\x00\x00");
        });

        if (newSegments[1].slice(0, 2) == "\xff\xe0") {
            newSegments.splice(2, 0, exif);
        } else {
            newSegments.splice(1, 0, exif);
        }

        return newSegments.join("");
    }


    function toByteArray(str: string) {
        var byteArray = [];
        for (var i = 0; i < str.length; i++) {
            byteArray.push(str.charCodeAt(i));
        }
        return byteArray;
    }

    function nStr(ch: string, num: number) {
        var str = "";
        for (var i = 0; i < num; i++) {
            str += ch;
        }
        return str;
    }

    function pack(mark: string, array: any[]) {
        if (!(array instanceof Array)) {
            throw new Error("'pack' error. Got invalid type argument.");
        }
        if ((mark.length - 1) != array.length) {
            throw new Error("'pack' error. " + (mark.length - 1) + " marks, " + array.length + " elements.");
        }

        var littleEndian;
        if (mark[0] == "<") {
            littleEndian = true;
        } else if (mark[0] == ">") {
            littleEndian = false;
        } else {
            throw new Error("");
        }
        var packed = "";
        var p = 1;
        var val = null;
        var c = null;
        var valStr = null;

        while (c = mark[p]) {
            if (c.toLowerCase() == "b") {
                val = array[p - 1];
                if ((c == "b") && (val < 0)) {
                    val += 0x100;
                }
                if ((val > 0xff) || (val < 0)) {
                    throw new Error("'pack' error.");
                } else {
                    valStr = String.fromCharCode(val);
                }
            } else if (c == "H") {
                val = array[p - 1];
                if ((val > 0xffff) || (val < 0)) {
                    throw new Error("'pack' error.");
                } else {
                    valStr = String.fromCharCode(Math.floor((val % 0x10000) / 0x100)) +
                        String.fromCharCode(val % 0x100);
                    if (littleEndian) {
                        valStr = valStr.split("").reverse().join("");
                    }
                }
            } else if (c.toLowerCase() == "l") {
                val = array[p - 1];
                if ((c == "l") && (val < 0)) {
                    val += 0x100000000;
                }
                if ((val > 0xffffffff) || (val < 0)) {
                    throw new Error("'pack' error.");
                } else {
                    valStr = String.fromCharCode(Math.floor(val / 0x1000000)) +
                        String.fromCharCode(Math.floor((val % 0x1000000) / 0x10000)) +
                        String.fromCharCode(Math.floor((val % 0x10000) / 0x100)) +
                        String.fromCharCode(val % 0x100);
                    if (littleEndian) {
                        valStr = valStr.split("").reverse().join("");
                    }
                }
            } else {
                // throw new Error("'pack' error.");
            }

            packed += valStr;
            p += 1;
        }

        return packed;
    }

    function unpack(mark: string, str: string) {
        if (typeof (str) != "string") {
            throw new Error("'unpack' error. Got invalid type argument.");
        }
        var p = 0;
        var unpacked = [];
        var c = null;
        var val = null;
        var littleEndian;
        if (mark[0] == "<") {
            littleEndian = true;
        } else if (mark[0] == ">") {
            littleEndian = false;
        } else {
            throw new Error("");
        }

        for (var i = 1; i < mark.length; i++) {
            c = mark[i];
            if (c.toLowerCase() == "b") {
                val = str.charCodeAt(p);
                if (c == "b" && val >= 0x80) {
                    val -= 0x100;
                }
                p += 1;
            } else if (c == "H") {
                val = str.charCodeAt(p) * 256 + str.charCodeAt(p + 1);
                if (littleEndian) {
                    val = str.charCodeAt(p + 1) * 256 + str.charCodeAt(p);
                }
                p += 2;
            } else if (c.toLowerCase() == "l") {
                val = str.charCodeAt(p) * 16777216 + str.charCodeAt(p + 1) * 65536 +
                    str.charCodeAt(p + 2) * 256 + str.charCodeAt(p + 3);
                if (littleEndian) {
                    val = str.charCodeAt(p + 3) * 16777216 + str.charCodeAt(p + 2) * 65536 +
                        str.charCodeAt(p + 1) * 256 + str.charCodeAt(p);
                }
                if (c == "l" && val >= 2147483648) {
                    val -= 4294967296;
                }
                p += 4;
            } else {
                // throw new Error("'unpack' error.");
            }
            unpacked.push(val);
        }

        return unpacked;
    }

    function _dict_to_bytes(ifd_dict: any, ifd: any, ifd_offset: any) {
        var TIFF_HEADER_LENGTH = 8;
        var tag_count = Object.keys(ifd_dict).length;
        var entry_header = pack(">H", [tag_count]);
        var entries_length;
        if (["0th", "1st"].indexOf(ifd) > -1) {
            entries_length = 2 + tag_count * 12 + 4;
        } else {
            entries_length = 2 + tag_count * 12;
        }
        var entries = "";
        var values = "";
        var key;

        for (var key_str in ifd_dict) {
            var key_val = key_str;
            if (typeof (key_val) == "string") {
                key = parseInt(key_val);
            } else {
                key = key_val;
            }

            if ((ifd == "0th") && ([34665, 34853].indexOf(key) > -1)) {
                continue;
            } else if ((ifd == "Exif") && (key == 40965)) {
                continue;
            } else if ((ifd == "1st") && ([513, 514].indexOf(key) > -1)) {
                continue;
            }

            var raw_value = ifd_dict[key];
            var key_str_packed = pack(">H", [key]);
            var value_type = TAGS[ifd][key]["type"];
            var type_str = pack(">H", [TYPES[value_type]]);

            if (typeof (raw_value) == "number") {
                raw_value = [raw_value];
            }
            var offset = TIFF_HEADER_LENGTH + entries_length + ifd_offset + values.length;
            var b = _value_to_bytes(raw_value, value_type, offset);
            var length_str = b[0];
            var value_str = b[1];
            var four_bytes_over = b[2];

            entries += key_str_packed + type_str + length_str + value_str;
            values += four_bytes_over;
        }

        return [entry_header + entries, values];
    }

    function _value_to_bytes(raw_value: any, value_type: any, offset: any) {
        var four_bytes_over = "";
        var value_str = "";
        var length,
            new_value,
            num,
            den;

        if (value_type == "Byte") {
            length = raw_value.length;
            if (length <= 4) {
                value_str = (_pack_byte(raw_value) +
                    nStr("\x00", 4 - length));
            } else {
                value_str = pack(">L", [offset]);
                four_bytes_over = _pack_byte(raw_value);
            }
        } else if (value_type == "Short") {
            length = raw_value.length;
            if (length <= 2) {
                value_str = (_pack_short(raw_value) +
                    nStr("\x00\x00", 2 - length));
            } else {
                value_str = pack(">L", [offset]);
                four_bytes_over = _pack_short(raw_value);
            }
        } else if (value_type == "Long") {
            length = raw_value.length;
            if (length <= 1) {
                value_str = _pack_long(raw_value);
            } else {
                value_str = pack(">L", [offset]);
                four_bytes_over = _pack_long(raw_value);
            }
        } else if (value_type == "Ascii") {
            new_value = raw_value + "\x00";
            length = new_value.length;
            if (length > 4) {
                value_str = pack(">L", [offset]);
                four_bytes_over = new_value;
            } else {
                value_str = new_value + nStr("\x00", 4 - length);
            }
        } else if (value_type == "Rational") {
            if (typeof (raw_value[0]) == "number") {
                length = 1;
                num = raw_value[0];
                den = raw_value[1];
                new_value = pack(">L", [num]) + pack(">L", [den]);
            } else {
                length = raw_value.length;
                new_value = "";
                for (var n = 0; n < length; n++) {
                    num = raw_value[n][0];
                    den = raw_value[n][1];
                    new_value += (pack(">L", [num]) +
                        pack(">L", [den]));
                }
            }
            value_str = pack(">L", [offset]);
            four_bytes_over = new_value;
        } else if (value_type == "SRational") {
            if (typeof (raw_value[0]) == "number") {
                length = 1;
                num = raw_value[0];
                den = raw_value[1];
                new_value = pack(">l", [num]) + pack(">l", [den]);
            } else {
                length = raw_value.length;
                new_value = "";
                for (var n = 0; n < length; n++) {
                    num = raw_value[n][0];
                    den = raw_value[n][1];
                    new_value += (pack(">l", [num]) +
                        pack(">l", [den]));
                }
            }
            value_str = pack(">L", [offset]);
            four_bytes_over = new_value;
        } else if (value_type == "Undefined") {
            length = raw_value.length;
            if (length > 4) {
                value_str = pack(">L", [offset]);
                four_bytes_over = raw_value;
            } else {
                value_str = raw_value + nStr("\x00", 4 - length);
            }
        }

        var length_str = pack(">L", [length]);

        return [length_str, value_str, four_bytes_over];
    }

    function _pack_byte(array: any) {
        return pack(">" + nStr("B", array.length), array);
    }


    function _pack_short(array: any) {
        return pack(">" + nStr("H", array.length), array);
    }


    function _pack_long(array: any) {
        return pack(">" + nStr("L", array.length), array);
    }

    function _get_thumbnail(jpeg: any) {
        var segments = splitIntoSegments(jpeg);
        while (("\xff\xe0" <= segments[1].slice(0, 2)) && (segments[1].slice(0, 2) <= "\xff\xef")) {
            segments = [segments[0]].concat(segments.slice(2));
        }
        return segments.join("");
    }

    function slice2Segments(imageArray: any) {
        var segments = [];
        var length, offset = 2;
        var head = 0;

        while (offset < imageArray.length && head < 100) { // Limit loop
            var marker = imageArray[offset];
            if (imageArray[offset] === 0xff) {
                var type = imageArray[offset + 1];
                if (type === 0xda) { // SOS
                    segments.push([0, 0xda]); // Simplified
                    break;
                }
                offset += 2;
                length = imageArray[offset] * 256 + imageArray[offset + 1];
                segments.push([0, type, 0, 0, 0, imageArray[offset + 3] * 256 + imageArray[offset + 4], imageArray[offset + 5] * 256 + imageArray[offset + 6]]);
                offset += length;
            } else {
                break;
            }
            head++;
        }
        return segments;
    }

    function ExifReader(data: any) { this.tiftag = data; }
    ExifReader.prototype = {
        get_ifd: function (pointer: any, ifd_name: any) { return {}; }, // Stub for load
        convert_value: function (val: any) { return val; }
    }
    // Note: The 'load' function in this minimal port is intentionally limited 
    // because we only need 'remove' and 'insert' properly for our usecase.
    // The full reader is complex to strict-type. Ideally we just blindly copy EXIF string.

    return that;
})();

// End of PiexifJS Wrapper
