#include <SPI.h>
#include "font.h"

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
}

void loop() {
    setText("1 2min");
    render();
    delay(4000);

    for (int i = 0; i < 8; i++) {
        shiftUp();
        render();
        delay(150);
    }

    setText("3ex 5min");
    render();
    delay(4000);

    for (int i = 0; i < 8; i++) {
        shiftUp();
        render();
        delay(150);
    }
}