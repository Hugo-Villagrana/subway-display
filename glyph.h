#pragma once

struct RouteGlyphEntry {
    const char* route_id;
    const uint8_t cols[8];
};

// https://www.riyas.org/2013/12/online-led-matrix-font-generator-with.html
static const RouteGlyphEntry ROUTE_GLYPH_TABLE[] = {
    {"1", {0x3c,0x6e,0xcf,0xef,0xef,0xef,0x46,0x3c}},
    {"2", {0x3c,0x66,0xdb,0xfb,0xe7,0xdf,0x42,0x3c}},
    {"3", {0x3c,0x42,0xfb,0xe7,0xfb,0xdb,0x66,0x3c}},
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