#pragma once

struct RouteGlyphEntry {
    const char* route_id;
    const uint8_t cols[8];
};

// https://www.riyas.org/2013/12/online-led-matrix-font-generator-with.html
static const RouteGlyphEntry ROUTE_GLYPH_TABLE[] = {
    {"1", {0x3c,0x66,0xc7,0xe7,0xe7,0xc3,0x42,0x3c}},
    {"2", {0x3C, 0x7E, 0xE7, 0x81, 0x81, 0xE7, 0x7E, 0x3C}},
    {"3", {0x3C, 0x7E, 0xE7, 0x81, 0x81, 0xE7, 0x7E, 0x3C}},
};

inline const uint8_t* routeGlyphFor(const char* routeId) {
    if (!routeId) return nullptr;

    for (int i = 0; ROUTE_GLYPH_TABLE[i].route_id != nullptr; i++) {
        if (strcmp(ROUTE_GLYPH_TABLE[i].route_id, routeId) == 0) {
            return ROUTE_GLYPH_TABLE[i].cols;
        }
    }
    return nullptr;
}