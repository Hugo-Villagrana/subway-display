#include <SPI.h>
#include <ratio>
#include "font.h"

#define CS 5
#define NUM_MODULES 8

void sendCmd(uint8_t reg, uint8_t data) {
    digitalWrite(CS, LOW);
    for (int i = 0; i < NUM_MODULES; i++) {
        SPI.transfer(reg);
        SPI.transfer(data);
    }
    digitalWrite(CS, HIGH);
}

void sendRowAll(uint8_t row, uint8_t *values) {
    digitalWrite(CS, LOW);
    for (int i = NUM_MODULES - 1; i >= 0; i--) {
        SPI.transfer(row);
        SPI.transfer(values[i]);
    }

    digitalWrite(CS, HIGH);
}

byte matrix[8][NUM_MODULES] = {0};

// void setPixel(int x, int y, bool on) {
//     byte mask = 1 << x;
//     if (on) {
//         matrix[y] |= mask;
//     } else {
//         matrix[y] &= ~mask;
//     }
// }

// void drawBitmap(byte bitmap[8]) {
//     for (int y = 0; y < 8; y++) {
//         matrix[y] = bitmap[y];
//     }
// }

// void drawChar(char c) {
//     for (int y = 0; y < 8; y++) {
//         matrix[y] = font[c][y];
//     }
// }

// void shift() {
//     for (int y = 0; y < 8; y++) {
//         byte leftmost = (matrix[y] & 0x80) >> 7;
//         matrix[y] <<= 1;
//         matrix[y] |= leftmost;
//     }
// }

// void shiftLeft(byte newCol) {
//     for (int y = 0; y < 8; y++) {
//         matrix[y] >>= 1;

//         if (newCol & (1 << y)) {
//             matrix[y] |= 0x80;
//         }
//     }
// }

void render() {
    for (int row = 0; row < 8; row++) {
        sendRowAll(row + 1, matrix[row]);
    }
}



byte reverseBits(byte b) {
    b = (b & 0xF0) >> 4 | (b & 0x0F) << 4;
    b = (b & 0xCC) >> 2 | (b & 0x33) << 2;
    b = (b & 0xAA) >> 1 | (b & 0x55) << 1;
    return b;
}

byte getColumn(char c, int col) {
    byte column = 0x00;

    for (int y = 0; y < 8; y++) {
        if (font[c][y] & (1 << (7 - col))) {
            column |= (1 << (7 - y));
        }
    }

    return column;
}

void shiftUp(byte newRow[NUM_MODULES]) {
    for (int y = 7; y > 0; y--) {
        for (int m = 0; m < NUM_MODULES; m++) {
            matrix[y][m] = matrix[y - 1][m];
        }
    }

    for (int m = 0; m < NUM_MODULES; m++) {
        matrix[0][m] = newRow[m];
    }
}

void getRow(char c, int row, byte out[NUM_MODULES]) {
    for (int m = 0; m < NUM_MODULES; m++) {
        out[m] = 0x00;
    }

    out[0] = reverseBits(font[c][row]);
}

void drawWord(const char* text) {
    for (int row = 0; row < 8; row++) {
        for (int m = 0; m < NUM_MODULES; m++) {
            if (text[m] != '\0') {
                matrix[row][m] = reverseBits(font[text[m]][row]);
            } else {
                matrix[row][m] = 0;
            }
        }
    }
}

void buildRow(const char* text, int row, byte out[NUM_MODULES]) {
    for (int m = 0; m < NUM_MODULES; m++) {
        if (text[m] != '\0') {
            out[m] = reverseBits(font[text[m]][row]);
        } else {
            out[m] = 0x00;
        }
    }
}

void scrollWordUp(const char* text) {
    byte newRow[NUM_MODULES];

    // push in new word
    for (int row = 0; row < 8; row++) {
        buildRow(text, row, newRow);

        shiftUp(newRow);
        render();
        delay(150);
    }
}

// void scrollTextUp(const char* text) {
//     while (*text) {
//         char c = *text++;

//         for (int row = 0; row < 8; row++) {
//             byte newRow = getRow(c, row);

//             shiftUp(newRow);
//             render();
//             delay(150);
//         }

//         // spacing
//         shiftUp(0x00);
//         render();
//         delay(150);
//     }
// }

void scrollTextUp(const char* text) {
    byte newRow[NUM_MODULES];

    while (*text) {
        char c = *text++;

        for (int row = 0; row < 8; row++) {
            getRow(c, row, newRow);

            shiftUp(newRow);
            render();
            delay(150);
        }

        // spacing
        for (int m = 0; m < NUM_MODULES; m++) newRow[m] = 0;

        shiftUp(newRow);
        render();
        delay(150);
    }
}

// void scrollText(const char* text) {
//     while (*text) {
//         char c = *text++;

//         for (int col = 0; col < 8; col++) {
//             byte newCol = getColumn(c, col);

//             shiftLeft(newCol);
//             render();
//             delay(500);
//         }

//         shiftLeft(0x00);
//         render();
//         delay(500);
//     }
// }



void setup() {
    SPI.begin(18, -1, 23, CS);
    pinMode(CS, OUTPUT);
    digitalWrite(CS, HIGH);

    delay(100);

    sendCmd(0x0F, 0x00);
    sendCmd(0x0C, 0x01);
    sendCmd(0x0B, 0x07);
    sendCmd(0x0A, 0x00);
    sendCmd(0x09, 0x00);

    memset(matrix, 0, sizeof(matrix));
}

void loop() {
    // drawWord("HELLO");
    // render();
    // delay(2000);

    // scrollWordUp("WORLD");
    // delay(2000);

    // scrollWordUp("HUGO");
    // delay(2000);



    // shift();
    // render();
    // delay(1000);
    // memset(matrix, 0, sizeof(matrix));
    // scrollTextUp("AB ");

    // setPixel(0, 0, true);
    // render();
    // delay(1000);

    // for (int x = 0; x < 8; x++) {
    //     memset(matrix, 0, sizeof(matrix));

    //     setPixel(x, x, true);

    //     render();
    //     delay(150);
    // }

    // uint8_t values[NUM_MODULES] = {0};

    // for (int i = 0; i < NUM_MODULES; i++) {
    //     values[i] = 0xFF;
    //     for (int row = 1; row <= 8; row++) {
    //         sendRowAll(row, values);
    //     }

    //     delay(300);
    // }
}