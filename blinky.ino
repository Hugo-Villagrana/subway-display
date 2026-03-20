#include <SPI.h>
#include "font.h"
#include "glyph.h"
#include <HTTPClient.h>
#include <WiFi.h>
#include <ArduinoJson.h>

#define CS 5
#define NUM_MODULES 8
#define COLUMNS_PER_MODULE 8

// display[module][column]
uint8_t display[NUM_MODULES][COLUMNS_PER_MODULE];

void sendCmd(uint8_t reg, uint8_t data) {
    digitalWrite(CS, LOW);
    for (int i = 0; i < NUM_MODULES; i++) {
        SPI.transfer(reg);
        SPI.transfer(data);
    }
    digitalWrite(CS, HIGH);
}

void sendRow(uint8_t row, uint8_t values[NUM_MODULES]) {
    digitalWrite(CS, LOW);

    for (int i = NUM_MODULES - 1; i >= 0; i--) {
        SPI.transfer(row);
        SPI.transfer(values[i]);
    }

    digitalWrite(CS, HIGH);
}

void clearDisplay() {
    for (int m = 0; m < NUM_MODULES; m++) {
        for (int c = 0; c < COLUMNS_PER_MODULE; c++) {
            display[m][c] = 0x00;
        }
    }
}

void setText(const char* text) {
    clearDisplay();

    for (int m = 0; m < NUM_MODULES && text[m] != '\0'; m++) {
        char c = text[m];
        int base = c * FONT_CHAR_WIDTH;

        int xOffset = 2;  // horizontal center
        int yOffset = 0;  // try 1 if you want vertical centering

        for (int col = 0; col < FONT_CHAR_WIDTH; col++) {
            display[m][col + xOffset] =
                font_data[base + (FONT_CHAR_WIDTH - 1 - col)] << yOffset;
        }
    }
}

void shiftUp() {
    for (int m = 0; m < NUM_MODULES; m++) {
        for (int col = 0; col < 8; col++) {
            display[m][col] >>= 1;
        }
    }
}

void render() {
    for (int row = 0; row < 8; row++) {
        uint8_t rowData[NUM_MODULES];

        for (int m = 0; m < NUM_MODULES; m++) {
            uint8_t value = 0;

            for (int col = 0; col < 8; col++) {
                // map display (bottom=bit0) → MAX7219 (top=row1)
                if (display[m][col] & (1 << (7 - row))) {
                    value |= (1 << (7 - col));
                }
            }

            rowData[m] = value;
        }

        sendRow(row + 1, rowData);
    }
}

static char deviceId[13];

void setup() {
    SPI.begin(18, -1, 23, CS);
    pinMode(CS, OUTPUT);
    digitalWrite(CS, HIGH);

    delay(100);

    // MAX7219 init
    sendCmd(0x0F, 0x00);
    sendCmd(0x0C, 0x01);
    sendCmd(0x0B, 0x07);
    sendCmd(0x0A, 0x00);
    sendCmd(0x09, 0x00);

    // Device ID
    uint64_t chipId = ESP.getEfuseMac();
    sprintf(deviceId, "%04X%08X", (uint16_t)(chipId >> 32), (uint32_t)chipId);
    Serial.print("Device ID: ");
    Serial.println(deviceId);


    // Setup WiFi
    char* ssid = "Verizon_BT7Z6C";
    char* password = "ray6editor3isle";

    Serial.begin(115200);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print("...");
    }

    Serial.println("\nConnected");
    Serial.println(WiFi.localIP());
}

uint8_t TRAIN_1[8] = {
    0b00111100,
    0b01111110,
    0b11100111,
    0b11000111,
    0b11000111,
    0b11100111,
    0b01111110,
    0b00111100
};


void rotate90Right(const uint8_t in[8], uint8_t out[8]) {
    for (int col = 0; col < 8; col++) {
        out[col] = 0;
        for (int row = 0; row < 8; row++) {
            if (in[row] & (1 << (7 - col))) {
                out[col] |= (1 << row);
            }
        }
    }
}

void drawRouteGlyph(uint8_t module, const char* routeId) {
    const uint8_t* glyph = routeGlyphFor(routeId);
    if (!glyph) return;

    uint8_t rotated[8];
    rotate90Right(glyph, rotated);

    for (int col = 0; col < 8; col++) {
        display[module][col] = rotated[7 - col];
    }
}

void loop() {
    HTTPClient http;
    http.begin(String("http://192.168.1.163:8080/api/v1/devices/") + deviceId + "/arrivals");
    int code = http.GET();
    // if (code == 200) {
    //     String payload = http.getString();

    //     DynamicJsonDocument doc(8192);
    //     DeserializationError err = deserializeJson(doc, payload);
    //     if (err) {
    //         Serial.print("JSON parse error: ");
    //         Serial.println(err.c_str());
    //         http.end();
    //         delay(5000);
    //         return;
    //     }

    //     JsonArray arrivals = doc.as<JsonArray>();
    //     int idx = 0;
    //     for (JsonObject arrival : arrivals) {
    //         const char* stopId = arrival["stop_id"];
    //         const char* routeId = arrival["route_id"];
    //         const char* direction = arrival["direction"];
    //         const int arrivesInMin = arrival["arrives_in_min"];
    //         Serial.print("Idx ");
    //         Serial.print(idx);
    //         Serial.print(": Stop ");
    //         Serial.print(stopId);
    //         Serial.print(" on ");
    //         Serial.print(routeId);
    //         Serial.print(" in ");
    //         Serial.print(arrivesInMin);
    //         Serial.println(" minutes");

    //         char text[16];
    //         snprintf(text, sizeof(text), "%d.%s%dmin", idx, routeId, arrivesInMin);
    //         setText(text);

    //         render();
    //         delay(4000);
    //         for (int i = 0; i < 8; i++) {
    //             shiftUp();
    //             render();
    //             delay(150);
    //         }
    //         idx++;
    //     }
    // }

    http.end();
    delay(500);

    drawRouteGlyph(0, "1");
    render();
    delay(4000);

    for (int i = 0; i < 8; i++) {
        shiftUp();
        render();
        delay(150);
    }

    // drawRouteGlyph(0, "2");
    // render();
    // delay(4000);

    // drawRouteGlyph(0, "3");
    // render();
    // delay(4000);

    // for (int i = 0; i < 8; i++) {
    //     shiftUp();
    //     render();
    //     delay(150);
    // }

    // setText("3ex 5min");
    // render();
    // delay(4000);

    // for (int i = 0; i < 8; i++) {
    //     shiftUp();
    //     render();
    //     delay(150);
    // }
}